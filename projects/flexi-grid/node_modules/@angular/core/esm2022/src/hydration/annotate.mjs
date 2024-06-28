/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isDetachedByI18n } from '../i18n/utils';
import { ViewEncapsulation } from '../metadata';
import { assertTNode } from '../render3/assert';
import { collectNativeNodes, collectNativeNodesInLContainer } from '../render3/collect_native_nodes';
import { getComponentDef } from '../render3/definition';
import { CONTAINER_HEADER_OFFSET } from '../render3/interfaces/container';
import { isTNodeShape } from '../render3/interfaces/node';
import { hasI18n, isComponentHost, isLContainer, isProjectionTNode, isRootView, } from '../render3/interfaces/type_checks';
import { CONTEXT, HEADER_OFFSET, HOST, PARENT, RENDERER, TVIEW, } from '../render3/interfaces/view';
import { unwrapLView, unwrapRNode } from '../render3/util/view_utils';
import { TransferState } from '../transfer_state';
import { unsupportedProjectionOfDomNodes } from './error_handling';
import { collectDomEventsInfo } from './event_replay';
import { setJSActionAttribute } from '../event_delegation_utils';
import { getOrComputeI18nChildren, isI18nHydrationEnabled, isI18nHydrationSupportEnabled, trySerializeI18nBlock, } from './i18n';
import { CONTAINERS, DISCONNECTED_NODES, ELEMENT_CONTAINERS, I18N_DATA, MULTIPLIER, NODES, NUM_ROOT_NODES, TEMPLATE_ID, TEMPLATES, } from './interfaces';
import { calcPathForNode, isDisconnectedNode } from './node_lookup_utils';
import { isInSkipHydrationBlock, SKIP_HYDRATION_ATTR_NAME } from './skip_hydration';
import { EVENT_REPLAY_ENABLED_DEFAULT, IS_EVENT_REPLAY_ENABLED } from './tokens';
import { getLNodeForHydration, NGH_ATTR_NAME, NGH_DATA_KEY, processTextNodeBeforeSerialization, } from './utils';
/**
 * A collection that tracks all serialized views (`ngh` DOM annotations)
 * to avoid duplication. An attempt to add a duplicate view results in the
 * collection returning the index of the previously collected serialized view.
 * This reduces the number of annotations needed for a given page.
 */
class SerializedViewCollection {
    constructor() {
        this.views = [];
        this.indexByContent = new Map();
    }
    add(serializedView) {
        const viewAsString = JSON.stringify(serializedView);
        if (!this.indexByContent.has(viewAsString)) {
            const index = this.views.length;
            this.views.push(serializedView);
            this.indexByContent.set(viewAsString, index);
            return index;
        }
        return this.indexByContent.get(viewAsString);
    }
    getAll() {
        return this.views;
    }
}
/**
 * Global counter that is used to generate a unique id for TViews
 * during the serialization process.
 */
let tViewSsrId = 0;
/**
 * Generates a unique id for a given TView and returns this id.
 * The id is also stored on this instance of a TView and reused in
 * subsequent calls.
 *
 * This id is needed to uniquely identify and pick up dehydrated views
 * at runtime.
 */
function getSsrId(tView) {
    if (!tView.ssrId) {
        tView.ssrId = `t${tViewSsrId++}`;
    }
    return tView.ssrId;
}
/**
 * Computes the number of root nodes in a given view
 * (or child nodes in a given container if a tNode is provided).
 */
function calcNumRootNodes(tView, lView, tNode) {
    const rootNodes = [];
    collectNativeNodes(tView, lView, tNode, rootNodes);
    return rootNodes.length;
}
/**
 * Computes the number of root nodes in all views in a given LContainer.
 */
function calcNumRootNodesInLContainer(lContainer) {
    const rootNodes = [];
    collectNativeNodesInLContainer(lContainer, rootNodes);
    return rootNodes.length;
}
/**
 * Annotates root level component's LView for hydration,
 * see `annotateHostElementForHydration` for additional information.
 */
function annotateComponentLViewForHydration(lView, context) {
    const hostElement = lView[HOST];
    // Root elements might also be annotated with the `ngSkipHydration` attribute,
    // check if it's present before starting the serialization process.
    if (hostElement && !hostElement.hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
        return annotateHostElementForHydration(hostElement, lView, context);
    }
    return null;
}
/**
 * Annotates root level LContainer for hydration. This happens when a root component
 * injects ViewContainerRef, thus making the component an anchor for a view container.
 * This function serializes the component itself as well as all views from the view
 * container.
 */
function annotateLContainerForHydration(lContainer, context) {
    const componentLView = unwrapLView(lContainer[HOST]);
    // Serialize the root component itself.
    const componentLViewNghIndex = annotateComponentLViewForHydration(componentLView, context);
    if (componentLViewNghIndex === null) {
        // Component was not serialized (for example, if hydration was skipped by adding
        // the `ngSkipHydration` attribute or this component uses i18n blocks in the template,
        // but `withI18nSupport()` was not added), avoid annotating host element with the `ngh`
        // attribute.
        return;
    }
    const hostElement = unwrapRNode(componentLView[HOST]);
    // Serialize all views within this view container.
    const rootLView = lContainer[PARENT];
    const rootLViewNghIndex = annotateHostElementForHydration(hostElement, rootLView, context);
    const renderer = componentLView[RENDERER];
    // For cases when a root component also acts as an anchor node for a ViewContainerRef
    // (for example, when ViewContainerRef is injected in a root component), there is a need
    // to serialize information about the component itself, as well as an LContainer that
    // represents this ViewContainerRef. Effectively, we need to serialize 2 pieces of info:
    // (1) hydration info for the root component itself and (2) hydration info for the
    // ViewContainerRef instance (an LContainer). Each piece of information is included into
    // the hydration data (in the TransferState object) separately, thus we end up with 2 ids.
    // Since we only have 1 root element, we encode both bits of info into a single string:
    // ids are separated by the `|` char (e.g. `10|25`, where `10` is the ngh for a component view
    // and 25 is the `ngh` for a root view which holds LContainer).
    const finalIndex = `${componentLViewNghIndex}|${rootLViewNghIndex}`;
    renderer.setAttribute(hostElement, NGH_ATTR_NAME, finalIndex);
}
/**
 * Annotates all components bootstrapped in a given ApplicationRef
 * with info needed for hydration.
 *
 * @param appRef An instance of an ApplicationRef.
 * @param doc A reference to the current Document instance.
 * @return event types that need to be replayed
 */
export function annotateForHydration(appRef, doc) {
    const injector = appRef.injector;
    const isI18nHydrationEnabledVal = isI18nHydrationEnabled(injector);
    const serializedViewCollection = new SerializedViewCollection();
    const corruptedTextNodes = new Map();
    const viewRefs = appRef._views;
    const shouldReplayEvents = injector.get(IS_EVENT_REPLAY_ENABLED, EVENT_REPLAY_ENABLED_DEFAULT);
    const eventTypesToReplay = {
        regular: new Set(),
        capture: new Set(),
    };
    for (const viewRef of viewRefs) {
        const lNode = getLNodeForHydration(viewRef);
        // An `lView` might be `null` if a `ViewRef` represents
        // an embedded view (not a component view).
        if (lNode !== null) {
            const context = {
                serializedViewCollection,
                corruptedTextNodes,
                isI18nHydrationEnabled: isI18nHydrationEnabledVal,
                i18nChildren: new Map(),
                eventTypesToReplay,
                shouldReplayEvents,
            };
            if (isLContainer(lNode)) {
                annotateLContainerForHydration(lNode, context);
            }
            else {
                annotateComponentLViewForHydration(lNode, context);
            }
            insertCorruptedTextNodeMarkers(corruptedTextNodes, doc);
        }
    }
    // Note: we *always* include hydration info key and a corresponding value
    // into the TransferState, even if the list of serialized views is empty.
    // This is needed as a signal to the client that the server part of the
    // hydration logic was setup and enabled correctly. Otherwise, if a client
    // hydration doesn't find a key in the transfer state - an error is produced.
    const serializedViews = serializedViewCollection.getAll();
    const transferState = injector.get(TransferState);
    transferState.set(NGH_DATA_KEY, serializedViews);
    return eventTypesToReplay;
}
/**
 * Serializes the lContainer data into a list of SerializedView objects,
 * that represent views within this lContainer.
 *
 * @param lContainer the lContainer we are serializing
 * @param context the hydration context
 * @returns an array of the `SerializedView` objects
 */
function serializeLContainer(lContainer, context) {
    const views = [];
    let lastViewAsString = '';
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        let childLView = lContainer[i];
        let template;
        let numRootNodes;
        let serializedView;
        if (isRootView(childLView)) {
            // If this is a root view, get an LView for the underlying component,
            // because it contains information about the view to serialize.
            childLView = childLView[HEADER_OFFSET];
            // If we have an LContainer at this position, this indicates that the
            // host element was used as a ViewContainerRef anchor (e.g. a `ViewContainerRef`
            // was injected within the component class). This case requires special handling.
            if (isLContainer(childLView)) {
                // Calculate the number of root nodes in all views in a given container
                // and increment by one to account for an anchor node itself, i.e. in this
                // scenario we'll have a layout that would look like this:
                // `<app-root /><#VIEW1><#VIEW2>...<!--container-->`
                // The `+1` is to capture the `<app-root />` element.
                numRootNodes = calcNumRootNodesInLContainer(childLView) + 1;
                annotateLContainerForHydration(childLView, context);
                const componentLView = unwrapLView(childLView[HOST]);
                serializedView = {
                    [TEMPLATE_ID]: componentLView[TVIEW].ssrId,
                    [NUM_ROOT_NODES]: numRootNodes,
                };
            }
        }
        if (!serializedView) {
            const childTView = childLView[TVIEW];
            if (childTView.type === 1 /* TViewType.Component */) {
                template = childTView.ssrId;
                // This is a component view, thus it has only 1 root node: the component
                // host node itself (other nodes would be inside that host node).
                numRootNodes = 1;
            }
            else {
                template = getSsrId(childTView);
                numRootNodes = calcNumRootNodes(childTView, childLView, childTView.firstChild);
            }
            serializedView = {
                [TEMPLATE_ID]: template,
                [NUM_ROOT_NODES]: numRootNodes,
                ...serializeLView(lContainer[i], context),
            };
        }
        // Check if the previous view has the same shape (for example, it was
        // produced by the *ngFor), in which case bump the counter on the previous
        // view instead of including the same information again.
        const currentViewAsString = JSON.stringify(serializedView);
        if (views.length > 0 && currentViewAsString === lastViewAsString) {
            const previousView = views[views.length - 1];
            previousView[MULTIPLIER] ??= 1;
            previousView[MULTIPLIER]++;
        }
        else {
            // Record this view as most recently added.
            lastViewAsString = currentViewAsString;
            views.push(serializedView);
        }
    }
    return views;
}
/**
 * Helper function to produce a node path (which navigation steps runtime logic
 * needs to take to locate a node) and stores it in the `NODES` section of the
 * current serialized view.
 */
function appendSerializedNodePath(ngh, tNode, lView, excludedParentNodes) {
    const noOffsetIndex = tNode.index - HEADER_OFFSET;
    ngh[NODES] ??= {};
    // Ensure we don't calculate the path multiple times.
    ngh[NODES][noOffsetIndex] ??= calcPathForNode(tNode, lView, excludedParentNodes);
}
/**
 * Helper function to append information about a disconnected node.
 * This info is needed at runtime to avoid DOM lookups for this element
 * and instead, the element would be created from scratch.
 */
function appendDisconnectedNodeIndex(ngh, tNodeOrNoOffsetIndex) {
    const noOffsetIndex = typeof tNodeOrNoOffsetIndex === 'number'
        ? tNodeOrNoOffsetIndex
        : tNodeOrNoOffsetIndex.index - HEADER_OFFSET;
    ngh[DISCONNECTED_NODES] ??= [];
    if (!ngh[DISCONNECTED_NODES].includes(noOffsetIndex)) {
        ngh[DISCONNECTED_NODES].push(noOffsetIndex);
    }
}
/**
 * Serializes the lView data into a SerializedView object that will later be added
 * to the TransferState storage and referenced using the `ngh` attribute on a host
 * element.
 *
 * @param lView the lView we are serializing
 * @param context the hydration context
 * @returns the `SerializedView` object containing the data to be added to the host node
 */
function serializeLView(lView, context) {
    const ngh = {};
    const tView = lView[TVIEW];
    const i18nChildren = getOrComputeI18nChildren(tView, context);
    const nativeElementsToEventTypes = context.shouldReplayEvents
        ? collectDomEventsInfo(tView, lView, context.eventTypesToReplay)
        : null;
    // Iterate over DOM element references in an LView.
    for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
        const tNode = tView.data[i];
        const noOffsetIndex = i - HEADER_OFFSET;
        // Attempt to serialize any i18n data for the given slot. We do this first, as i18n
        // has its own process for serialization.
        const i18nData = trySerializeI18nBlock(lView, i, context);
        if (i18nData) {
            ngh[I18N_DATA] ??= {};
            ngh[I18N_DATA][noOffsetIndex] = i18nData.caseQueue;
            for (const nodeNoOffsetIndex of i18nData.disconnectedNodes) {
                appendDisconnectedNodeIndex(ngh, nodeNoOffsetIndex);
            }
            for (const nodeNoOffsetIndex of i18nData.disjointNodes) {
                const tNode = tView.data[nodeNoOffsetIndex + HEADER_OFFSET];
                ngDevMode && assertTNode(tNode);
                appendSerializedNodePath(ngh, tNode, lView, i18nChildren);
            }
            continue;
        }
        // Skip processing of a given slot in the following cases:
        // - Local refs (e.g. <div #localRef>) take up an extra slot in LViews
        //   to store the same element. In this case, there is no information in
        //   a corresponding slot in TNode data structure.
        // - When a slot contains something other than a TNode. For example, there
        //   might be some metadata information about a defer block or a control flow block.
        if (!isTNodeShape(tNode)) {
            continue;
        }
        // Skip any nodes that are in an i18n block but are considered detached (i.e. not
        // present in the template). These nodes are disconnected from the DOM tree, and
        // so we don't want to serialize any information about them.
        if (isDetachedByI18n(tNode)) {
            continue;
        }
        // Check if a native node that represents a given TNode is disconnected from the DOM tree.
        // Such nodes must be excluded from the hydration (since the hydration won't be able to
        // find them), so the TNode ids are collected and used at runtime to skip the hydration.
        //
        // This situation may happen during the content projection, when some nodes don't make it
        // into one of the content projection slots (for example, when there is no default
        // <ng-content /> slot in projector component's template).
        if (isDisconnectedNode(tNode, lView) && isContentProjectedNode(tNode)) {
            appendDisconnectedNodeIndex(ngh, tNode);
            continue;
        }
        // Attach `jsaction` attribute to elements that have registered listeners,
        // thus potentially having a need to do an event replay.
        if (nativeElementsToEventTypes && tNode.type & 2 /* TNodeType.Element */) {
            const nativeElement = unwrapRNode(lView[i]);
            if (nativeElementsToEventTypes.has(nativeElement)) {
                setJSActionAttribute(nativeElement, nativeElementsToEventTypes.get(nativeElement));
            }
        }
        if (Array.isArray(tNode.projection)) {
            for (const projectionHeadTNode of tNode.projection) {
                // We may have `null`s in slots with no projected content.
                if (!projectionHeadTNode)
                    continue;
                if (!Array.isArray(projectionHeadTNode)) {
                    // If we process re-projected content (i.e. `<ng-content>`
                    // appears at projection location), skip annotations for this content
                    // since all DOM nodes in this projection were handled while processing
                    // a parent lView, which contains those nodes.
                    if (!isProjectionTNode(projectionHeadTNode) &&
                        !isInSkipHydrationBlock(projectionHeadTNode)) {
                        if (isDisconnectedNode(projectionHeadTNode, lView)) {
                            // Check whether this node is connected, since we may have a TNode
                            // in the data structure as a projection segment head, but the
                            // content projection slot might be disabled (e.g.
                            // <ng-content *ngIf="false" />).
                            appendDisconnectedNodeIndex(ngh, projectionHeadTNode);
                        }
                        else {
                            appendSerializedNodePath(ngh, projectionHeadTNode, lView, i18nChildren);
                        }
                    }
                }
                else {
                    // If a value is an array, it means that we are processing a projection
                    // where projectable nodes were passed in as DOM nodes (for example, when
                    // calling `ViewContainerRef.createComponent(CmpA, {projectableNodes: [...]})`).
                    //
                    // In this scenario, nodes can come from anywhere (either created manually,
                    // accessed via `document.querySelector`, etc) and may be in any state
                    // (attached or detached from the DOM tree). As a result, we can not reliably
                    // restore the state for such cases during hydration.
                    throw unsupportedProjectionOfDomNodes(unwrapRNode(lView[i]));
                }
            }
        }
        conditionallyAnnotateNodePath(ngh, tNode, lView, i18nChildren);
        if (isLContainer(lView[i])) {
            // Serialize information about a template.
            const embeddedTView = tNode.tView;
            if (embeddedTView !== null) {
                ngh[TEMPLATES] ??= {};
                ngh[TEMPLATES][noOffsetIndex] = getSsrId(embeddedTView);
            }
            // Serialize views within this LContainer.
            const hostNode = lView[i][HOST]; // host node of this container
            // LView[i][HOST] can be of 2 different types:
            // - either a DOM node
            // - or an array that represents an LView of a component
            if (Array.isArray(hostNode)) {
                // This is a component, serialize info about it.
                const targetNode = unwrapRNode(hostNode);
                if (!targetNode.hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
                    annotateHostElementForHydration(targetNode, hostNode, context);
                }
            }
            ngh[CONTAINERS] ??= {};
            ngh[CONTAINERS][noOffsetIndex] = serializeLContainer(lView[i], context);
        }
        else if (Array.isArray(lView[i])) {
            // This is a component, annotate the host node with an `ngh` attribute.
            const targetNode = unwrapRNode(lView[i][HOST]);
            if (!targetNode.hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
                annotateHostElementForHydration(targetNode, lView[i], context);
            }
        }
        else {
            // <ng-container> case
            if (tNode.type & 8 /* TNodeType.ElementContainer */) {
                // An <ng-container> is represented by the number of
                // top-level nodes. This information is needed to skip over
                // those nodes to reach a corresponding anchor node (comment node).
                ngh[ELEMENT_CONTAINERS] ??= {};
                ngh[ELEMENT_CONTAINERS][noOffsetIndex] = calcNumRootNodes(tView, lView, tNode.child);
            }
            else if (tNode.type & (16 /* TNodeType.Projection */ | 128 /* TNodeType.LetDeclaration */)) {
                // Current TNode represents an `<ng-content>` slot or `@let` declaration,
                // thus it has no DOM elements associated with it, so the **next sibling**
                // node would not be able to find an anchor. In this case, use full path instead.
                let nextTNode = tNode.next;
                // Skip over all `<ng-content>` slots and `@let` declarations in a row.
                while (nextTNode !== null &&
                    nextTNode.type & (16 /* TNodeType.Projection */ | 128 /* TNodeType.LetDeclaration */)) {
                    nextTNode = nextTNode.next;
                }
                if (nextTNode && !isInSkipHydrationBlock(nextTNode)) {
                    // Handle a tNode after the `<ng-content>` slot.
                    appendSerializedNodePath(ngh, nextTNode, lView, i18nChildren);
                }
            }
            else if (tNode.type & 1 /* TNodeType.Text */) {
                const rNode = unwrapRNode(lView[i]);
                processTextNodeBeforeSerialization(context, rNode);
            }
        }
    }
    return ngh;
}
/**
 * Serializes node location in cases when it's needed, specifically:
 *
 *  1. If `tNode.projectionNext` is different from `tNode.next` - it means that
 *     the next `tNode` after projection is different from the one in the original
 *     template. Since hydration relies on `tNode.next`, this serialized info
 *     is required to help runtime code find the node at the correct location.
 *  2. In certain content projection-based use-cases, it's possible that only
 *     a content of a projected element is rendered. In this case, content nodes
 *     require an extra annotation, since runtime logic can't rely on parent-child
 *     connection to identify the location of a node.
 */
function conditionallyAnnotateNodePath(ngh, tNode, lView, excludedParentNodes) {
    // Handle case #1 described above.
    if (tNode.projectionNext &&
        tNode.projectionNext !== tNode.next &&
        !isInSkipHydrationBlock(tNode.projectionNext)) {
        appendSerializedNodePath(ngh, tNode.projectionNext, lView, excludedParentNodes);
    }
    // Handle case #2 described above.
    // Note: we only do that for the first node (i.e. when `tNode.prev === null`),
    // the rest of the nodes would rely on the current node location, so no extra
    // annotation is needed.
    if (tNode.prev === null &&
        tNode.parent !== null &&
        isDisconnectedNode(tNode.parent, lView) &&
        !isDisconnectedNode(tNode, lView)) {
        appendSerializedNodePath(ngh, tNode, lView, excludedParentNodes);
    }
}
/**
 * Determines whether a component instance that is represented
 * by a given LView uses `ViewEncapsulation.ShadowDom`.
 */
function componentUsesShadowDomEncapsulation(lView) {
    const instance = lView[CONTEXT];
    return instance?.constructor
        ? getComponentDef(instance.constructor)?.encapsulation === ViewEncapsulation.ShadowDom
        : false;
}
/**
 * Annotates component host element for hydration:
 * - by either adding the `ngh` attribute and collecting hydration-related info
 *   for the serialization and transferring to the client
 * - or by adding the `ngSkipHydration` attribute in case Angular detects that
 *   component contents is not compatible with hydration.
 *
 * @param element The Host element to be annotated
 * @param lView The associated LView
 * @param context The hydration context
 * @returns An index of serialized view from the transfer state object
 *          or `null` when a given component can not be serialized.
 */
function annotateHostElementForHydration(element, lView, context) {
    const renderer = lView[RENDERER];
    if ((hasI18n(lView) && !isI18nHydrationSupportEnabled()) ||
        componentUsesShadowDomEncapsulation(lView)) {
        // Attach the skip hydration attribute if this component:
        // - either has i18n blocks, since hydrating such blocks is not yet supported
        // - or uses ShadowDom view encapsulation, since Domino doesn't support
        //   shadow DOM, so we can not guarantee that client and server representations
        //   would exactly match
        renderer.setAttribute(element, SKIP_HYDRATION_ATTR_NAME, '');
        return null;
    }
    else {
        const ngh = serializeLView(lView, context);
        const index = context.serializedViewCollection.add(ngh);
        renderer.setAttribute(element, NGH_ATTR_NAME, index.toString());
        return index;
    }
}
/**
 * Physically inserts the comment nodes to ensure empty text nodes and adjacent
 * text node separators are preserved after server serialization of the DOM.
 * These get swapped back for empty text nodes or separators once hydration happens
 * on the client.
 *
 * @param corruptedTextNodes The Map of text nodes to be replaced with comments
 * @param doc The document
 */
function insertCorruptedTextNodeMarkers(corruptedTextNodes, doc) {
    for (const [textNode, marker] of corruptedTextNodes) {
        textNode.after(doc.createComment(marker));
    }
}
/**
 * Detects whether a given TNode represents a node that
 * is being content projected.
 */
function isContentProjectedNode(tNode) {
    let currentTNode = tNode;
    while (currentTNode != null) {
        // If we come across a component host node in parent nodes -
        // this TNode is in the content projection section.
        if (isComponentHost(currentTNode)) {
            return true;
        }
        currentTNode = currentTNode.parent;
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vYW5ub3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUU5QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDOUMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDhCQUE4QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDbkcsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyx1QkFBdUIsRUFBYSxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sNEJBQTRCLENBQUM7QUFFMUUsT0FBTyxFQUNMLE9BQU8sRUFDUCxlQUFlLEVBQ2YsWUFBWSxFQUNaLGlCQUFpQixFQUNqQixVQUFVLEdBQ1gsTUFBTSxtQ0FBbUMsQ0FBQztBQUMzQyxPQUFPLEVBQ0wsT0FBTyxFQUNQLGFBQWEsRUFDYixJQUFJLEVBRUosTUFBTSxFQUNOLFFBQVEsRUFFUixLQUFLLEdBRU4sTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQUMsV0FBVyxFQUFFLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVoRCxPQUFPLEVBQUMsK0JBQStCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUMvRCxPQUFP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QyxPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsOEJBQThCLENBQ3JDLGtCQUE0QyxFQUM1QyxHQUFhO0lBRWIsS0FBSyxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLGtCQUFrQixFQUFFLENBQUM7UUFDcEQsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDNUMsQ0FBQztBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHNCQUFzQixDQUFDLEtBQVk7SUFDMUMsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3pCLE9BQU8sWUFBWSxJQUFJLElBQUksRUFBRSxDQUFDO1FBQzVCLDREQUE0RDtRQUM1RCxtREFBbUQ7UUFDbkQsSUFBSSxlQUFlLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztZQUNsQyxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxZQUFZLEdBQUcsWUFBWSxDQUFDLE1BQWUsQ0FBQztJQUM5QyxDQUFDO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0FQUF9JRH0gZnJvbSAnLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7aXNEZXRhY2hlZEJ5STE4bn0gZnJvbSAnLi4vaTE4bi91dGlscyc7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi9tZXRhZGF0YSc7XG5pbXBvcnQge1JlbmRlcmVyMn0gZnJvbSAnLi4vcmVuZGVyJztcbmltcG9ydCB7YXNzZXJ0VE5vZGV9IGZyb20gJy4uL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7Y29sbGVjdE5hdGl2ZU5vZGVzLCBjb2xsZWN0TmF0aXZlTm9kZXNJbkxDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvY29sbGVjdF9uYXRpdmVfbm9kZXMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4uL3JlbmRlcjMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7aXNUTm9kZVNoYXBlLCBUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7XG4gIGhhc0kxOG4sXG4gIGlzQ29tcG9uZW50SG9zdCxcbiAgaXNMQ29udGFpbmVyLFxuICBpc1Byb2plY3Rpb25UTm9kZSxcbiAgaXNSb290Vmlldyxcbn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7XG4gIENPTlRFWFQsXG4gIEhFQURFUl9PRkZTRVQsXG4gIEhPU1QsXG4gIExWaWV3LFxuICBQQVJFTlQsXG4gIFJFTkRFUkVSLFxuICBUVmlldyxcbiAgVFZJRVcsXG4gIFRWaWV3VHlwZSxcbn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHt1bndyYXBMVmlldywgdW53cmFwUk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7VHJhbnNmZXJTdGF0ZX0gZnJvbSAnLi4vdHJhbnNmZXJfc3RhdGUnO1xuXG5pbXBvcnQge3Vuc3VwcG9ydGVkUHJvamVjdGlvbk9mRG9tTm9kZXN9IGZyb20gJy4vZXJyb3JfaGFuZGxpbmcnO1xuaW1wb3J0IHtjb2xsZWN0RG9tRXZlbnRzSW5mb30gZnJvbSAnLi9ldmVudF9yZXBsYXknO1xuaW1wb3J0IHtzZXRKU0FjdGlvbkF0dHJpYnV0ZX0gZnJvbSAnLi4vZXZlbnRfZGVsZWdhdGlvbl91dGlscyc7XG5pbXBvcnQge1xuICBnZXRPckNvbXB1dGVJMThuQ2hpbGRyZW4sXG4gIGlzSTE4bkh5ZHJhdGlvbkVuYWJsZWQsXG4gIGlzSTE4bkh5ZHJhdGlvblN1cHBvcnRFbmFibGVkLFxuICB0cnlTZXJpYWxpemVJMThuQmxvY2ssXG59IGZyb20gJy4vaTE4bic7XG5pbXBvcnQge1xuICBDT05UQUlORVJTLFxuICBESVNDT05ORUNURURfTk9ERVMsXG4gIEVMRU1FTlRfQ09OVEFJTkVSUyxcbiAgSTE4Tl9EQVRBLFxuICBNVUxUSVBMSUVSLFxuICBOT0RFUyxcbiAgTlVNX1JPT1RfTk9ERVMsXG4gIFNlcmlhbGl6ZWRDb250YWluZXJWaWV3LFxuICBTZXJpYWxpemVkVmlldyxcbiAgVEVNUExBVEVfSUQsXG4gIFRFTVBMQVRFUyxcbn0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7Y2FsY1BhdGhGb3JOb2RlLCBpc0Rpc2Nvbm5lY3RlZE5vZGV9IGZyb20gJy4vbm9kZV9sb29rdXBfdXRpbHMnO1xuaW1wb3J0IHtpc0luU2tpcEh5ZHJhdGlvbkJsb2NrLCBTS0lQX0hZRFJBVElPTl9BVFRSX05BTUV9IGZyb20gJy4vc2tpcF9oeWRyYXRpb24nO1xuaW1wb3J0IHtFVkVOVF9SRVBMQVlfRU5BQkxFRF9ERUZBVUxULCBJU19FVkVOVF9SRVBMQVlfRU5BQkxFRH0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHtcbiAgZ2V0TE5vZGVGb3JIeWRyYXRpb24sXG4gIE5HSF9BVFRSX05BTUUsXG4gIE5HSF9EQVRBX0tFWSxcbiAgcHJvY2Vzc1RleHROb2RlQmVmb3JlU2VyaWFsaXphdGlvbixcbiAgVGV4dE5vZGVNYXJrZXIsXG59IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIEEgY29sbGVjdGlvbiB0aGF0IHRyYWNrcyBhbGwgc2VyaWFsaXplZCB2aWV3cyAoYG5naGAgRE9NIGFubm90YXRpb25zKVxuICogdG8gYXZvaWQgZHVwbGljYXRpb24uIEFuIGF0dGVtcHQgdG8gYWRkIGEgZHVwbGljYXRlIHZpZXcgcmVzdWx0cyBpbiB0aGVcbiAqIGNvbGxlY3Rpb24gcmV0dXJuaW5nIHRoZSBpbmRleCBvZiB0aGUgcHJldmlvdXNseSBjb2xsZWN0ZWQgc2VyaWFsaXplZCB2aWV3LlxuICogVGhpcyByZWR1Y2VzIHRoZSBudW1iZXIgb2YgYW5ub3RhdGlvbnMgbmVlZGVkIGZvciBhIGdpdmVuIHBhZ2UuXG4gKi9cbmNsYXNzIFNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbiB7XG4gIHByaXZhdGUgdmlld3M6IFNlcmlhbGl6ZWRWaWV3W10gPSBbXTtcbiAgcHJpdmF0ZSBpbmRleEJ5Q29udGVudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgYWRkKHNlcmlhbGl6ZWRWaWV3OiBTZXJpYWxpemVkVmlldyk6IG51bWJlciB7XG4gICAgY29uc3Qgdmlld0FzU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplZFZpZXcpO1xuICAgIGlmICghdGhpcy5pbmRleEJ5Q29udGVudC5oYXModmlld0FzU3RyaW5nKSkge1xuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnZpZXdzLmxlbmd0aDtcbiAgICAgIHRoaXMudmlld3MucHVzaChzZXJpYWxpemVkVmlldyk7XG4gICAgICB0aGlzLmluZGV4QnlDb250ZW50LnNldCh2aWV3QXNTdHJpbmcsIGluZGV4KTtcbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaW5kZXhCeUNvbnRlbnQuZ2V0KHZpZXdBc1N0cmluZykhO1xuICB9XG5cbiAgZ2V0QWxsKCk6IFNlcmlhbGl6ZWRWaWV3W10ge1xuICAgIHJldHVybiB0aGlzLnZpZXdzO1xuICB9XG59XG5cbi8qKlxuICogR2xvYmFsIGNvdW50ZXIgdGhhdCBpcyB1c2VkIHRvIGdlbmVyYXRlIGEgdW5pcXVlIGlkIGZvciBUVmlld3NcbiAqIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvbiBwcm9jZXNzLlxuICovXG5sZXQgdFZpZXdTc3JJZCA9IDA7XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgdW5pcXVlIGlkIGZvciBhIGdpdmVuIFRWaWV3IGFuZCByZXR1cm5zIHRoaXMgaWQuXG4gKiBUaGUgaWQgaXMgYWxzbyBzdG9yZWQgb24gdGhpcyBpbnN0YW5jZSBvZiBhIFRWaWV3IGFuZCByZXVzZWQgaW5cbiAqIHN1YnNlcXVlbnQgY2FsbHMuXG4gKlxuICogVGhpcyBpZCBpcyBuZWVkZWQgdG8gdW5pcXVlbHkgaWRlbnRpZnkgYW5kIHBpY2sgdXAgZGVoeWRyYXRlZCB2aWV3c1xuICogYXQgcnVudGltZS5cbiAqL1xuZnVuY3Rpb24gZ2V0U3NySWQodFZpZXc6IFRWaWV3KTogc3RyaW5nIHtcbiAgaWYgKCF0Vmlldy5zc3JJZCkge1xuICAgIHRWaWV3LnNzcklkID0gYHQke3RWaWV3U3NySWQrK31gO1xuICB9XG4gIHJldHVybiB0Vmlldy5zc3JJZDtcbn1cblxuLyoqXG4gKiBEZXNjcmliZXMgYSBjb250ZXh0IGF2YWlsYWJsZSBkdXJpbmcgdGhlIHNlcmlhbGl6YXRpb25cbiAqIHByb2Nlc3MuIFRoZSBjb250ZXh0IGlzIHVzZWQgdG8gc2hhcmUgYW5kIGNvbGxlY3QgaW5mb3JtYXRpb25cbiAqIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBIeWRyYXRpb25Db250ZXh0IHtcbiAgc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uOiBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb247XG4gIGNvcnJ1cHRlZFRleHROb2RlczogTWFwPEhUTUxFbGVtZW50LCBUZXh0Tm9kZU1hcmtlcj47XG4gIGlzSTE4bkh5ZHJhdGlvbkVuYWJsZWQ6IGJvb2xlYW47XG4gIGkxOG5DaGlsZHJlbjogTWFwPFRWaWV3LCBTZXQ8bnVtYmVyPiB8IG51bGw+O1xuICBldmVudFR5cGVzVG9SZXBsYXk6IHtyZWd1bGFyOiBTZXQ8c3RyaW5nPjsgY2FwdHVyZTogU2V0PHN0cmluZz59O1xuICBzaG91bGRSZXBsYXlFdmVudHM6IGJvb2xlYW47XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIG51bWJlciBvZiByb290IG5vZGVzIGluIGEgZ2l2ZW4gdmlld1xuICogKG9yIGNoaWxkIG5vZGVzIGluIGEgZ2l2ZW4gY29udGFpbmVyIGlmIGEgdE5vZGUgaXMgcHJvdmlkZWQpLlxuICovXG5mdW5jdGlvbiBjYWxjTnVtUm9vdE5vZGVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUgfCBudWxsKTogbnVtYmVyIHtcbiAgY29uc3Qgcm9vdE5vZGVzOiB1bmtub3duW10gPSBbXTtcbiAgY29sbGVjdE5hdGl2ZU5vZGVzKHRWaWV3LCBsVmlldywgdE5vZGUsIHJvb3ROb2Rlcyk7XG4gIHJldHVybiByb290Tm9kZXMubGVuZ3RoO1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBudW1iZXIgb2Ygcm9vdCBub2RlcyBpbiBhbGwgdmlld3MgaW4gYSBnaXZlbiBMQ29udGFpbmVyLlxuICovXG5mdW5jdGlvbiBjYWxjTnVtUm9vdE5vZGVzSW5MQ29udGFpbmVyKGxDb250YWluZXI6IExDb250YWluZXIpOiBudW1iZXIge1xuICBjb25zdCByb290Tm9kZXM6IHVua25vd25bXSA9IFtdO1xuICBjb2xsZWN0TmF0aXZlTm9kZXNJbkxDb250YWluZXIobENvbnRhaW5lciwgcm9vdE5vZGVzKTtcbiAgcmV0dXJuIHJvb3ROb2Rlcy5sZW5ndGg7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIHJvb3QgbGV2ZWwgY29tcG9uZW50J3MgTFZpZXcgZm9yIGh5ZHJhdGlvbixcbiAqIHNlZSBgYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbmAgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24uXG4gKi9cbmZ1bmN0aW9uIGFubm90YXRlQ29tcG9uZW50TFZpZXdGb3JIeWRyYXRpb24oXG4gIGxWaWV3OiBMVmlldyxcbiAgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCxcbik6IG51bWJlciB8IG51bGwge1xuICBjb25zdCBob3N0RWxlbWVudCA9IGxWaWV3W0hPU1RdO1xuICAvLyBSb290IGVsZW1lbnRzIG1pZ2h0IGFsc28gYmUgYW5ub3RhdGVkIHdpdGggdGhlIGBuZ1NraXBIeWRyYXRpb25gIGF0dHJpYnV0ZSxcbiAgLy8gY2hlY2sgaWYgaXQncyBwcmVzZW50IGJlZm9yZSBzdGFydGluZyB0aGUgc2VyaWFsaXphdGlvbiBwcm9jZXNzLlxuICBpZiAoaG9zdEVsZW1lbnQgJiYgIShob3N0RWxlbWVudCBhcyBIVE1MRWxlbWVudCkuaGFzQXR0cmlidXRlKFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSkpIHtcbiAgICByZXR1cm4gYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbihob3N0RWxlbWVudCBhcyBIVE1MRWxlbWVudCwgbFZpZXcsIGNvbnRleHQpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyByb290IGxldmVsIExDb250YWluZXIgZm9yIGh5ZHJhdGlvbi4gVGhpcyBoYXBwZW5zIHdoZW4gYSByb290IGNvbXBvbmVudFxuICogaW5qZWN0cyBWaWV3Q29udGFpbmVyUmVmLCB0aHVzIG1ha2luZyB0aGUgY29tcG9uZW50IGFuIGFuY2hvciBmb3IgYSB2aWV3IGNvbnRhaW5lci5cbiAqIFRoaXMgZnVuY3Rpb24gc2VyaWFsaXplcyB0aGUgY29tcG9uZW50IGl0c2VsZiBhcyB3ZWxsIGFzIGFsbCB2aWV3cyBmcm9tIHRoZSB2aWV3XG4gKiBjb250YWluZXIuXG4gKi9cbmZ1bmN0aW9uIGFubm90YXRlTENvbnRhaW5lckZvckh5ZHJhdGlvbihsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KSB7XG4gIGNvbnN0IGNvbXBvbmVudExWaWV3ID0gdW53cmFwTFZpZXcobENvbnRhaW5lcltIT1NUXSkgYXMgTFZpZXc8dW5rbm93bj47XG5cbiAgLy8gU2VyaWFsaXplIHRoZSByb290IGNvbXBvbmVudCBpdHNlbGYuXG4gIGNvbnN0IGNvbXBvbmVudExWaWV3TmdoSW5kZXggPSBhbm5vdGF0ZUNvbXBvbmVudExWaWV3Rm9ySHlkcmF0aW9uKGNvbXBvbmVudExWaWV3LCBjb250ZXh0KTtcblxuICBpZiAoY29tcG9uZW50TFZpZXdOZ2hJbmRleCA9PT0gbnVsbCkge1xuICAgIC8vIENvbXBvbmVudCB3YXMgbm90IHNlcmlhbGl6ZWQgKGZvciBleGFtcGxlLCBpZiBoeWRyYXRpb24gd2FzIHNraXBwZWQgYnkgYWRkaW5nXG4gICAgLy8gdGhlIGBuZ1NraXBIeWRyYXRpb25gIGF0dHJpYnV0ZSBvciB0aGlzIGNvbXBvbmVudCB1c2VzIGkxOG4gYmxvY2tzIGluIHRoZSB0ZW1wbGF0ZSxcbiAgICAvLyBidXQgYHdpdGhJMThuU3VwcG9ydCgpYCB3YXMgbm90IGFkZGVkKSwgYXZvaWQgYW5ub3RhdGluZyBob3N0IGVsZW1lbnQgd2l0aCB0aGUgYG5naGBcbiAgICAvLyBhdHRyaWJ1dGUuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaG9zdEVsZW1lbnQgPSB1bndyYXBSTm9kZShjb21wb25lbnRMVmlld1tIT1NUXSEpIGFzIEhUTUxFbGVtZW50O1xuXG4gIC8vIFNlcmlhbGl6ZSBhbGwgdmlld3Mgd2l0aGluIHRoaXMgdmlldyBjb250YWluZXIuXG4gIGNvbnN0IHJvb3RMVmlldyA9IGxDb250YWluZXJbUEFSRU5UXTtcbiAgY29uc3Qgcm9vdExWaWV3TmdoSW5kZXggPSBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKGhvc3RFbGVtZW50LCByb290TFZpZXcsIGNvbnRleHQpO1xuXG4gIGNvbnN0IHJlbmRlcmVyID0gY29tcG9uZW50TFZpZXdbUkVOREVSRVJdIGFzIFJlbmRlcmVyMjtcblxuICAvLyBGb3IgY2FzZXMgd2hlbiBhIHJvb3QgY29tcG9uZW50IGFsc28gYWN0cyBhcyBhbiBhbmNob3Igbm9kZSBmb3IgYSBWaWV3Q29udGFpbmVyUmVmXG4gIC8vIChmb3IgZXhhbXBsZSwgd2hlbiBWaWV3Q29udGFpbmVyUmVmIGlzIGluamVjdGVkIGluIGEgcm9vdCBjb21wb25lbnQpLCB0aGVyZSBpcyBhIG5lZWRcbiAgLy8gdG8gc2VyaWFsaXplIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjb21wb25lbnQgaXRzZWxmLCBhcyB3ZWxsIGFzIGFuIExDb250YWluZXIgdGhhdFxuICAvLyByZXByZXNlbnRzIHRoaXMgVmlld0NvbnRhaW5lclJlZi4gRWZmZWN0aXZlbHksIHdlIG5lZWQgdG8gc2VyaWFsaXplIDIgcGllY2VzIG9mIGluZm86XG4gIC8vICgxKSBoeWRyYXRpb24gaW5mbyBmb3IgdGhlIHJvb3QgY29tcG9uZW50IGl0c2VsZiBhbmQgKDIpIGh5ZHJhdGlvbiBpbmZvIGZvciB0aGVcbiAgLy8gVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSAoYW4gTENvbnRhaW5lcikuIEVhY2ggcGllY2Ugb2YgaW5mb3JtYXRpb24gaXMgaW5jbHVkZWQgaW50b1xuICAvLyB0aGUgaHlkcmF0aW9uIGRhdGEgKGluIHRoZSBUcmFuc2ZlclN0YXRlIG9iamVjdCkgc2VwYXJhdGVseSwgdGh1cyB3ZSBlbmQgdXAgd2l0aCAyIGlkcy5cbiAgLy8gU2luY2Ugd2Ugb25seSBoYXZlIDEgcm9vdCBlbGVtZW50LCB3ZSBlbmNvZGUgYm90aCBiaXRzIG9mIGluZm8gaW50byBhIHNpbmdsZSBzdHJpbmc6XG4gIC8vIGlkcyBhcmUgc2VwYXJhdGVkIGJ5IHRoZSBgfGAgY2hhciAoZS5nLiBgMTB8MjVgLCB3aGVyZSBgMTBgIGlzIHRoZSBuZ2ggZm9yIGEgY29tcG9uZW50IHZpZXdcbiAgLy8gYW5kIDI1IGlzIHRoZSBgbmdoYCBmb3IgYSByb290IHZpZXcgd2hpY2ggaG9sZHMgTENvbnRhaW5lcikuXG4gIGNvbnN0IGZpbmFsSW5kZXggPSBgJHtjb21wb25lbnRMVmlld05naEluZGV4fXwke3Jvb3RMVmlld05naEluZGV4fWA7XG4gIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShob3N0RWxlbWVudCwgTkdIX0FUVFJfTkFNRSwgZmluYWxJbmRleCk7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIGFsbCBjb21wb25lbnRzIGJvb3RzdHJhcHBlZCBpbiBhIGdpdmVuIEFwcGxpY2F0aW9uUmVmXG4gKiB3aXRoIGluZm8gbmVlZGVkIGZvciBoeWRyYXRpb24uXG4gKlxuICogQHBhcmFtIGFwcFJlZiBBbiBpbnN0YW5jZSBvZiBhbiBBcHBsaWNhdGlvblJlZi5cbiAqIEBwYXJhbSBkb2MgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgRG9jdW1lbnQgaW5zdGFuY2UuXG4gKiBAcmV0dXJuIGV2ZW50IHR5cGVzIHRoYXQgbmVlZCB0byBiZSByZXBsYXllZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYW5ub3RhdGVGb3JIeWRyYXRpb24oYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgZG9jOiBEb2N1bWVudCkge1xuICBjb25zdCBpbmplY3RvciA9IGFwcFJlZi5pbmplY3RvcjtcbiAgY29uc3QgaXNJMThuSHlkcmF0aW9uRW5hYmxlZFZhbCA9IGlzSTE4bkh5ZHJhdGlvbkVuYWJsZWQoaW5qZWN0b3IpO1xuICBjb25zdCBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb24gPSBuZXcgU2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uKCk7XG4gIGNvbnN0IGNvcnJ1cHRlZFRleHROb2RlcyA9IG5ldyBNYXA8SFRNTEVsZW1lbnQsIFRleHROb2RlTWFya2VyPigpO1xuICBjb25zdCB2aWV3UmVmcyA9IGFwcFJlZi5fdmlld3M7XG4gIGNvbnN0IHNob3VsZFJlcGxheUV2ZW50cyA9IGluamVjdG9yLmdldChJU19FVkVOVF9SRVBMQVlfRU5BQkxFRCwgRVZFTlRfUkVQTEFZX0VOQUJMRURfREVGQVVMVCk7XG4gIGNvbnN0IGV2ZW50VHlwZXNUb1JlcGxheSA9IHtcbiAgICByZWd1bGFyOiBuZXcgU2V0PHN0cmluZz4oKSxcbiAgICBjYXB0dXJlOiBuZXcgU2V0PHN0cmluZz4oKSxcbiAgfTtcbiAgZm9yIChjb25zdCB2aWV3UmVmIG9mIHZpZXdSZWZzKSB7XG4gICAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZvckh5ZHJhdGlvbih2aWV3UmVmKTtcblxuICAgIC8vIEFuIGBsVmlld2AgbWlnaHQgYmUgYG51bGxgIGlmIGEgYFZpZXdSZWZgIHJlcHJlc2VudHNcbiAgICAvLyBhbiBlbWJlZGRlZCB2aWV3IChub3QgYSBjb21wb25lbnQgdmlldykuXG4gICAgaWYgKGxOb2RlICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0ID0ge1xuICAgICAgICBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb24sXG4gICAgICAgIGNvcnJ1cHRlZFRleHROb2RlcyxcbiAgICAgICAgaXNJMThuSHlkcmF0aW9uRW5hYmxlZDogaXNJMThuSHlkcmF0aW9uRW5hYmxlZFZhbCxcbiAgICAgICAgaTE4bkNoaWxkcmVuOiBuZXcgTWFwKCksXG4gICAgICAgIGV2ZW50VHlwZXNUb1JlcGxheSxcbiAgICAgICAgc2hvdWxkUmVwbGF5RXZlbnRzLFxuICAgICAgfTtcbiAgICAgIGlmIChpc0xDb250YWluZXIobE5vZGUpKSB7XG4gICAgICAgIGFubm90YXRlTENvbnRhaW5lckZvckh5ZHJhdGlvbihsTm9kZSwgY29udGV4dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbm5vdGF0ZUNvbXBvbmVudExWaWV3Rm9ySHlkcmF0aW9uKGxOb2RlLCBjb250ZXh0KTtcbiAgICAgIH1cbiAgICAgIGluc2VydENvcnJ1cHRlZFRleHROb2RlTWFya2Vycyhjb3JydXB0ZWRUZXh0Tm9kZXMsIGRvYyk7XG4gICAgfVxuICB9XG5cbiAgLy8gTm90ZTogd2UgKmFsd2F5cyogaW5jbHVkZSBoeWRyYXRpb24gaW5mbyBrZXkgYW5kIGEgY29ycmVzcG9uZGluZyB2YWx1ZVxuICAvLyBpbnRvIHRoZSBUcmFuc2ZlclN0YXRlLCBldmVuIGlmIHRoZSBsaXN0IG9mIHNlcmlhbGl6ZWQgdmlld3MgaXMgZW1wdHkuXG4gIC8vIFRoaXMgaXMgbmVlZGVkIGFzIGEgc2lnbmFsIHRvIHRoZSBjbGllbnQgdGhhdCB0aGUgc2VydmVyIHBhcnQgb2YgdGhlXG4gIC8vIGh5ZHJhdGlvbiBsb2dpYyB3YXMgc2V0dXAgYW5kIGVuYWJsZWQgY29ycmVjdGx5LiBPdGhlcndpc2UsIGlmIGEgY2xpZW50XG4gIC8vIGh5ZHJhdGlvbiBkb2Vzbid0IGZpbmQgYSBrZXkgaW4gdGhlIHRyYW5zZmVyIHN0YXRlIC0gYW4gZXJyb3IgaXMgcHJvZHVjZWQuXG4gIGNvbnN0IHNlcmlhbGl6ZWRWaWV3cyA9IHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbi5nZXRBbGwoKTtcbiAgY29uc3QgdHJhbnNmZXJTdGF0ZSA9IGluamVjdG9yLmdldChUcmFuc2ZlclN0YXRlKTtcbiAgdHJhbnNmZXJTdGF0ZS5zZXQoTkdIX0RBVEFfS0VZLCBzZXJpYWxpemVkVmlld3MpO1xuICByZXR1cm4gZXZlbnRUeXBlc1RvUmVwbGF5O1xufVxuXG4vKipcbiAqIFNlcmlhbGl6ZXMgdGhlIGxDb250YWluZXIgZGF0YSBpbnRvIGEgbGlzdCBvZiBTZXJpYWxpemVkVmlldyBvYmplY3RzLFxuICogdGhhdCByZXByZXNlbnQgdmlld3Mgd2l0aGluIHRoaXMgbENvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciB0aGUgbENvbnRhaW5lciB3ZSBhcmUgc2VyaWFsaXppbmdcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBoeWRyYXRpb24gY29udGV4dFxuICogQHJldHVybnMgYW4gYXJyYXkgb2YgdGhlIGBTZXJpYWxpemVkVmlld2Agb2JqZWN0c1xuICovXG5mdW5jdGlvbiBzZXJpYWxpemVMQ29udGFpbmVyKFxuICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLFxuICBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0LFxuKTogU2VyaWFsaXplZENvbnRhaW5lclZpZXdbXSB7XG4gIGNvbnN0IHZpZXdzOiBTZXJpYWxpemVkQ29udGFpbmVyVmlld1tdID0gW107XG4gIGxldCBsYXN0Vmlld0FzU3RyaW5nID0gJyc7XG5cbiAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgIGxldCBjaGlsZExWaWV3ID0gbENvbnRhaW5lcltpXSBhcyBMVmlldztcblxuICAgIGxldCB0ZW1wbGF0ZTogc3RyaW5nO1xuICAgIGxldCBudW1Sb290Tm9kZXM6IG51bWJlcjtcbiAgICBsZXQgc2VyaWFsaXplZFZpZXc6IFNlcmlhbGl6ZWRDb250YWluZXJWaWV3IHwgdW5kZWZpbmVkO1xuXG4gICAgaWYgKGlzUm9vdFZpZXcoY2hpbGRMVmlldykpIHtcbiAgICAgIC8vIElmIHRoaXMgaXMgYSByb290IHZpZXcsIGdldCBhbiBMVmlldyBmb3IgdGhlIHVuZGVybHlpbmcgY29tcG9uZW50LFxuICAgICAgLy8gYmVjYXVzZSBpdCBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdmlldyB0byBzZXJpYWxpemUuXG4gICAgICBjaGlsZExWaWV3ID0gY2hpbGRMVmlld1tIRUFERVJfT0ZGU0VUXTtcblxuICAgICAgLy8gSWYgd2UgaGF2ZSBhbiBMQ29udGFpbmVyIGF0IHRoaXMgcG9zaXRpb24sIHRoaXMgaW5kaWNhdGVzIHRoYXQgdGhlXG4gICAgICAvLyBob3N0IGVsZW1lbnQgd2FzIHVzZWQgYXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuY2hvciAoZS5nLiBhIGBWaWV3Q29udGFpbmVyUmVmYFxuICAgICAgLy8gd2FzIGluamVjdGVkIHdpdGhpbiB0aGUgY29tcG9uZW50IGNsYXNzKS4gVGhpcyBjYXNlIHJlcXVpcmVzIHNwZWNpYWwgaGFuZGxpbmcuXG4gICAgICBpZiAoaXNMQ29udGFpbmVyKGNoaWxkTFZpZXcpKSB7XG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgbnVtYmVyIG9mIHJvb3Qgbm9kZXMgaW4gYWxsIHZpZXdzIGluIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgICAgIC8vIGFuZCBpbmNyZW1lbnQgYnkgb25lIHRvIGFjY291bnQgZm9yIGFuIGFuY2hvciBub2RlIGl0c2VsZiwgaS5lLiBpbiB0aGlzXG4gICAgICAgIC8vIHNjZW5hcmlvIHdlJ2xsIGhhdmUgYSBsYXlvdXQgdGhhdCB3b3VsZCBsb29rIGxpa2UgdGhpczpcbiAgICAgICAgLy8gYDxhcHAtcm9vdCAvPjwjVklFVzE+PCNWSUVXMj4uLi48IS0tY29udGFpbmVyLS0+YFxuICAgICAgICAvLyBUaGUgYCsxYCBpcyB0byBjYXB0dXJlIHRoZSBgPGFwcC1yb290IC8+YCBlbGVtZW50LlxuICAgICAgICBudW1Sb290Tm9kZXMgPSBjYWxjTnVtUm9vdE5vZGVzSW5MQ29udGFpbmVyKGNoaWxkTFZpZXcpICsgMTtcblxuICAgICAgICBhbm5vdGF0ZUxDb250YWluZXJGb3JIeWRyYXRpb24oY2hpbGRMVmlldywgY29udGV4dCk7XG5cbiAgICAgICAgY29uc3QgY29tcG9uZW50TFZpZXcgPSB1bndyYXBMVmlldyhjaGlsZExWaWV3W0hPU1RdKSBhcyBMVmlldzx1bmtub3duPjtcblxuICAgICAgICBzZXJpYWxpemVkVmlldyA9IHtcbiAgICAgICAgICBbVEVNUExBVEVfSURdOiBjb21wb25lbnRMVmlld1tUVklFV10uc3NySWQhLFxuICAgICAgICAgIFtOVU1fUk9PVF9OT0RFU106IG51bVJvb3ROb2RlcyxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXNlcmlhbGl6ZWRWaWV3KSB7XG4gICAgICBjb25zdCBjaGlsZFRWaWV3ID0gY2hpbGRMVmlld1tUVklFV107XG5cbiAgICAgIGlmIChjaGlsZFRWaWV3LnR5cGUgPT09IFRWaWV3VHlwZS5Db21wb25lbnQpIHtcbiAgICAgICAgdGVtcGxhdGUgPSBjaGlsZFRWaWV3LnNzcklkITtcblxuICAgICAgICAvLyBUaGlzIGlzIGEgY29tcG9uZW50IHZpZXcsIHRodXMgaXQgaGFzIG9ubHkgMSByb290IG5vZGU6IHRoZSBjb21wb25lbnRcbiAgICAgICAgLy8gaG9zdCBub2RlIGl0c2VsZiAob3RoZXIgbm9kZXMgd291bGQgYmUgaW5zaWRlIHRoYXQgaG9zdCBub2RlKS5cbiAgICAgICAgbnVtUm9vdE5vZGVzID0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRlbXBsYXRlID0gZ2V0U3NySWQoY2hpbGRUVmlldyk7XG4gICAgICAgIG51bVJvb3ROb2RlcyA9IGNhbGNOdW1Sb290Tm9kZXMoY2hpbGRUVmlldywgY2hpbGRMVmlldywgY2hpbGRUVmlldy5maXJzdENoaWxkKTtcbiAgICAgIH1cblxuICAgICAgc2VyaWFsaXplZFZpZXcgPSB7XG4gICAgICAgIFtURU1QTEFURV9JRF06IHRlbXBsYXRlLFxuICAgICAgICBbTlVNX1JPT1RfTk9ERVNdOiBudW1Sb290Tm9kZXMsXG4gICAgICAgIC4uLnNlcmlhbGl6ZUxWaWV3KGxDb250YWluZXJbaV0gYXMgTFZpZXcsIGNvbnRleHQpLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgcHJldmlvdXMgdmlldyBoYXMgdGhlIHNhbWUgc2hhcGUgKGZvciBleGFtcGxlLCBpdCB3YXNcbiAgICAvLyBwcm9kdWNlZCBieSB0aGUgKm5nRm9yKSwgaW4gd2hpY2ggY2FzZSBidW1wIHRoZSBjb3VudGVyIG9uIHRoZSBwcmV2aW91c1xuICAgIC8vIHZpZXcgaW5zdGVhZCBvZiBpbmNsdWRpbmcgdGhlIHNhbWUgaW5mb3JtYXRpb24gYWdhaW4uXG4gICAgY29uc3QgY3VycmVudFZpZXdBc1N0cmluZyA9IEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZWRWaWV3KTtcbiAgICBpZiAodmlld3MubGVuZ3RoID4gMCAmJiBjdXJyZW50Vmlld0FzU3RyaW5nID09PSBsYXN0Vmlld0FzU3RyaW5nKSB7XG4gICAgICBjb25zdCBwcmV2aW91c1ZpZXcgPSB2aWV3c1t2aWV3cy5sZW5ndGggLSAxXTtcbiAgICAgIHByZXZpb3VzVmlld1tNVUxUSVBMSUVSXSA/Pz0gMTtcbiAgICAgIHByZXZpb3VzVmlld1tNVUxUSVBMSUVSXSsrO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZWNvcmQgdGhpcyB2aWV3IGFzIG1vc3QgcmVjZW50bHkgYWRkZWQuXG4gICAgICBsYXN0Vmlld0FzU3RyaW5nID0gY3VycmVudFZpZXdBc1N0cmluZztcbiAgICAgIHZpZXdzLnB1c2goc2VyaWFsaXplZFZpZXcpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmlld3M7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIHByb2R1Y2UgYSBub2RlIHBhdGggKHdoaWNoIG5hdmlnYXRpb24gc3RlcHMgcnVudGltZSBsb2dpY1xuICogbmVlZHMgdG8gdGFrZSB0byBsb2NhdGUgYSBub2RlKSBhbmQgc3RvcmVzIGl0IGluIHRoZSBgTk9ERVNgIHNlY3Rpb24gb2YgdGhlXG4gKiBjdXJyZW50IHNlcmlhbGl6ZWQgdmlldy5cbiAqL1xuZnVuY3Rpb24gYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKFxuICBuZ2g6IFNlcmlhbGl6ZWRWaWV3LFxuICB0Tm9kZTogVE5vZGUsXG4gIGxWaWV3OiBMVmlldyxcbiAgZXhjbHVkZWRQYXJlbnROb2RlczogU2V0PG51bWJlcj4gfCBudWxsLFxuKSB7XG4gIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIG5naFtOT0RFU10gPz89IHt9O1xuICAvLyBFbnN1cmUgd2UgZG9uJ3QgY2FsY3VsYXRlIHRoZSBwYXRoIG11bHRpcGxlIHRpbWVzLlxuICBuZ2hbTk9ERVNdW25vT2Zmc2V0SW5kZXhdID8/PSBjYWxjUGF0aEZvck5vZGUodE5vZGUsIGxWaWV3LCBleGNsdWRlZFBhcmVudE5vZGVzKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gYXBwZW5kIGluZm9ybWF0aW9uIGFib3V0IGEgZGlzY29ubmVjdGVkIG5vZGUuXG4gKiBUaGlzIGluZm8gaXMgbmVlZGVkIGF0IHJ1bnRpbWUgdG8gYXZvaWQgRE9NIGxvb2t1cHMgZm9yIHRoaXMgZWxlbWVudFxuICogYW5kIGluc3RlYWQsIHRoZSBlbGVtZW50IHdvdWxkIGJlIGNyZWF0ZWQgZnJvbSBzY3JhdGNoLlxuICovXG5mdW5jdGlvbiBhcHBlbmREaXNjb25uZWN0ZWROb2RlSW5kZXgobmdoOiBTZXJpYWxpemVkVmlldywgdE5vZGVPck5vT2Zmc2V0SW5kZXg6IFROb2RlIHwgbnVtYmVyKSB7XG4gIGNvbnN0IG5vT2Zmc2V0SW5kZXggPVxuICAgIHR5cGVvZiB0Tm9kZU9yTm9PZmZzZXRJbmRleCA9PT0gJ251bWJlcidcbiAgICAgID8gdE5vZGVPck5vT2Zmc2V0SW5kZXhcbiAgICAgIDogdE5vZGVPck5vT2Zmc2V0SW5kZXguaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICBuZ2hbRElTQ09OTkVDVEVEX05PREVTXSA/Pz0gW107XG4gIGlmICghbmdoW0RJU0NPTk5FQ1RFRF9OT0RFU10uaW5jbHVkZXMobm9PZmZzZXRJbmRleCkpIHtcbiAgICBuZ2hbRElTQ09OTkVDVEVEX05PREVTXS5wdXNoKG5vT2Zmc2V0SW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyB0aGUgbFZpZXcgZGF0YSBpbnRvIGEgU2VyaWFsaXplZFZpZXcgb2JqZWN0IHRoYXQgd2lsbCBsYXRlciBiZSBhZGRlZFxuICogdG8gdGhlIFRyYW5zZmVyU3RhdGUgc3RvcmFnZSBhbmQgcmVmZXJlbmNlZCB1c2luZyB0aGUgYG5naGAgYXR0cmlidXRlIG9uIGEgaG9zdFxuICogZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGxWaWV3IHdlIGFyZSBzZXJpYWxpemluZ1xuICogQHBhcmFtIGNvbnRleHQgdGhlIGh5ZHJhdGlvbiBjb250ZXh0XG4gKiBAcmV0dXJucyB0aGUgYFNlcmlhbGl6ZWRWaWV3YCBvYmplY3QgY29udGFpbmluZyB0aGUgZGF0YSB0byBiZSBhZGRlZCB0byB0aGUgaG9zdCBub2RlXG4gKi9cbmZ1bmN0aW9uIHNlcmlhbGl6ZUxWaWV3KGxWaWV3OiBMVmlldywgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCk6IFNlcmlhbGl6ZWRWaWV3IHtcbiAgY29uc3QgbmdoOiBTZXJpYWxpemVkVmlldyA9IHt9O1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgaTE4bkNoaWxkcmVuID0gZ2V0T3JDb21wdXRlSTE4bkNoaWxkcmVuKHRWaWV3LCBjb250ZXh0KTtcbiAgY29uc3QgbmF0aXZlRWxlbWVudHNUb0V2ZW50VHlwZXMgPSBjb250ZXh0LnNob3VsZFJlcGxheUV2ZW50c1xuICAgID8gY29sbGVjdERvbUV2ZW50c0luZm8odFZpZXcsIGxWaWV3LCBjb250ZXh0LmV2ZW50VHlwZXNUb1JlcGxheSlcbiAgICA6IG51bGw7XG4gIC8vIEl0ZXJhdGUgb3ZlciBET00gZWxlbWVudCByZWZlcmVuY2VzIGluIGFuIExWaWV3LlxuICBmb3IgKGxldCBpID0gSEVBREVSX09GRlNFVDsgaSA8IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4OyBpKyspIHtcbiAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbaV0gYXMgVE5vZGU7XG4gICAgY29uc3Qgbm9PZmZzZXRJbmRleCA9IGkgLSBIRUFERVJfT0ZGU0VUO1xuXG4gICAgLy8gQXR0ZW1wdCB0byBzZXJpYWxpemUgYW55IGkxOG4gZGF0YSBmb3IgdGhlIGdpdmVuIHNsb3QuIFdlIGRvIHRoaXMgZmlyc3QsIGFzIGkxOG5cbiAgICAvLyBoYXMgaXRzIG93biBwcm9jZXNzIGZvciBzZXJpYWxpemF0aW9uLlxuICAgIGNvbnN0IGkxOG5EYXRhID0gdHJ5U2VyaWFsaXplSTE4bkJsb2NrKGxWaWV3LCBpLCBjb250ZXh0KTtcbiAgICBpZiAoaTE4bkRhdGEpIHtcbiAgICAgIG5naFtJMThOX0RBVEFdID8/PSB7fTtcbiAgICAgIG5naFtJMThOX0RBVEFdW25vT2Zmc2V0SW5kZXhdID0gaTE4bkRhdGEuY2FzZVF1ZXVlO1xuXG4gICAgICBmb3IgKGNvbnN0IG5vZGVOb09mZnNldEluZGV4IG9mIGkxOG5EYXRhLmRpc2Nvbm5lY3RlZE5vZGVzKSB7XG4gICAgICAgIGFwcGVuZERpc2Nvbm5lY3RlZE5vZGVJbmRleChuZ2gsIG5vZGVOb09mZnNldEluZGV4KTtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBub2RlTm9PZmZzZXRJbmRleCBvZiBpMThuRGF0YS5kaXNqb2ludE5vZGVzKSB7XG4gICAgICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtub2RlTm9PZmZzZXRJbmRleCArIEhFQURFUl9PRkZTRVRdIGFzIFROb2RlO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGUodE5vZGUpO1xuICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCB0Tm9kZSwgbFZpZXcsIGkxOG5DaGlsZHJlbik7XG4gICAgICB9XG5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFNraXAgcHJvY2Vzc2luZyBvZiBhIGdpdmVuIHNsb3QgaW4gdGhlIGZvbGxvd2luZyBjYXNlczpcbiAgICAvLyAtIExvY2FsIHJlZnMgKGUuZy4gPGRpdiAjbG9jYWxSZWY+KSB0YWtlIHVwIGFuIGV4dHJhIHNsb3QgaW4gTFZpZXdzXG4gICAgLy8gICB0byBzdG9yZSB0aGUgc2FtZSBlbGVtZW50LiBJbiB0aGlzIGNhc2UsIHRoZXJlIGlzIG5vIGluZm9ybWF0aW9uIGluXG4gICAgLy8gICBhIGNvcnJlc3BvbmRpbmcgc2xvdCBpbiBUTm9kZSBkYXRhIHN0cnVjdHVyZS5cbiAgICAvLyAtIFdoZW4gYSBzbG90IGNvbnRhaW5zIHNvbWV0aGluZyBvdGhlciB0aGFuIGEgVE5vZGUuIEZvciBleGFtcGxlLCB0aGVyZVxuICAgIC8vICAgbWlnaHQgYmUgc29tZSBtZXRhZGF0YSBpbmZvcm1hdGlvbiBhYm91dCBhIGRlZmVyIGJsb2NrIG9yIGEgY29udHJvbCBmbG93IGJsb2NrLlxuICAgIGlmICghaXNUTm9kZVNoYXBlKHROb2RlKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gU2tpcCBhbnkgbm9kZXMgdGhhdCBhcmUgaW4gYW4gaTE4biBibG9jayBidXQgYXJlIGNvbnNpZGVyZWQgZGV0YWNoZWQgKGkuZS4gbm90XG4gICAgLy8gcHJlc2VudCBpbiB0aGUgdGVtcGxhdGUpLiBUaGVzZSBub2RlcyBhcmUgZGlzY29ubmVjdGVkIGZyb20gdGhlIERPTSB0cmVlLCBhbmRcbiAgICAvLyBzbyB3ZSBkb24ndCB3YW50IHRvIHNlcmlhbGl6ZSBhbnkgaW5mb3JtYXRpb24gYWJvdXQgdGhlbS5cbiAgICBpZiAoaXNEZXRhY2hlZEJ5STE4bih0Tm9kZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIGEgbmF0aXZlIG5vZGUgdGhhdCByZXByZXNlbnRzIGEgZ2l2ZW4gVE5vZGUgaXMgZGlzY29ubmVjdGVkIGZyb20gdGhlIERPTSB0cmVlLlxuICAgIC8vIFN1Y2ggbm9kZXMgbXVzdCBiZSBleGNsdWRlZCBmcm9tIHRoZSBoeWRyYXRpb24gKHNpbmNlIHRoZSBoeWRyYXRpb24gd29uJ3QgYmUgYWJsZSB0b1xuICAgIC8vIGZpbmQgdGhlbSksIHNvIHRoZSBUTm9kZSBpZHMgYXJlIGNvbGxlY3RlZCBhbmQgdXNlZCBhdCBydW50aW1lIHRvIHNraXAgdGhlIGh5ZHJhdGlvbi5cbiAgICAvL1xuICAgIC8vIFRoaXMgc2l0dWF0aW9uIG1heSBoYXBwZW4gZHVyaW5nIHRoZSBjb250ZW50IHByb2plY3Rpb24sIHdoZW4gc29tZSBub2RlcyBkb24ndCBtYWtlIGl0XG4gICAgLy8gaW50byBvbmUgb2YgdGhlIGNvbnRlbnQgcHJvamVjdGlvbiBzbG90cyAoZm9yIGV4YW1wbGUsIHdoZW4gdGhlcmUgaXMgbm8gZGVmYXVsdFxuICAgIC8vIDxuZy1jb250ZW50IC8+IHNsb3QgaW4gcHJvamVjdG9yIGNvbXBvbmVudCdzIHRlbXBsYXRlKS5cbiAgICBpZiAoaXNEaXNjb25uZWN0ZWROb2RlKHROb2RlLCBsVmlldykgJiYgaXNDb250ZW50UHJvamVjdGVkTm9kZSh0Tm9kZSkpIHtcbiAgICAgIGFwcGVuZERpc2Nvbm5lY3RlZE5vZGVJbmRleChuZ2gsIHROb2RlKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIEF0dGFjaCBganNhY3Rpb25gIGF0dHJpYnV0ZSB0byBlbGVtZW50cyB0aGF0IGhhdmUgcmVnaXN0ZXJlZCBsaXN0ZW5lcnMsXG4gICAgLy8gdGh1cyBwb3RlbnRpYWxseSBoYXZpbmcgYSBuZWVkIHRvIGRvIGFuIGV2ZW50IHJlcGxheS5cbiAgICBpZiAobmF0aXZlRWxlbWVudHNUb0V2ZW50VHlwZXMgJiYgdE5vZGUudHlwZSAmIFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gdW53cmFwUk5vZGUobFZpZXdbaV0pIGFzIEVsZW1lbnQ7XG4gICAgICBpZiAobmF0aXZlRWxlbWVudHNUb0V2ZW50VHlwZXMuaGFzKG5hdGl2ZUVsZW1lbnQpKSB7XG4gICAgICAgIHNldEpTQWN0aW9uQXR0cmlidXRlKG5hdGl2ZUVsZW1lbnQsIG5hdGl2ZUVsZW1lbnRzVG9FdmVudFR5cGVzLmdldChuYXRpdmVFbGVtZW50KSEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KHROb2RlLnByb2plY3Rpb24pKSB7XG4gICAgICBmb3IgKGNvbnN0IHByb2plY3Rpb25IZWFkVE5vZGUgb2YgdE5vZGUucHJvamVjdGlvbikge1xuICAgICAgICAvLyBXZSBtYXkgaGF2ZSBgbnVsbGBzIGluIHNsb3RzIHdpdGggbm8gcHJvamVjdGVkIGNvbnRlbnQuXG4gICAgICAgIGlmICghcHJvamVjdGlvbkhlYWRUTm9kZSkgY29udGludWU7XG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHByb2plY3Rpb25IZWFkVE5vZGUpKSB7XG4gICAgICAgICAgLy8gSWYgd2UgcHJvY2VzcyByZS1wcm9qZWN0ZWQgY29udGVudCAoaS5lLiBgPG5nLWNvbnRlbnQ+YFxuICAgICAgICAgIC8vIGFwcGVhcnMgYXQgcHJvamVjdGlvbiBsb2NhdGlvbiksIHNraXAgYW5ub3RhdGlvbnMgZm9yIHRoaXMgY29udGVudFxuICAgICAgICAgIC8vIHNpbmNlIGFsbCBET00gbm9kZXMgaW4gdGhpcyBwcm9qZWN0aW9uIHdlcmUgaGFuZGxlZCB3aGlsZSBwcm9jZXNzaW5nXG4gICAgICAgICAgLy8gYSBwYXJlbnQgbFZpZXcsIHdoaWNoIGNvbnRhaW5zIHRob3NlIG5vZGVzLlxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICFpc1Byb2plY3Rpb25UTm9kZShwcm9qZWN0aW9uSGVhZFROb2RlKSAmJlxuICAgICAgICAgICAgIWlzSW5Ta2lwSHlkcmF0aW9uQmxvY2socHJvamVjdGlvbkhlYWRUTm9kZSlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlmIChpc0Rpc2Nvbm5lY3RlZE5vZGUocHJvamVjdGlvbkhlYWRUTm9kZSwgbFZpZXcpKSB7XG4gICAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhpcyBub2RlIGlzIGNvbm5lY3RlZCwgc2luY2Ugd2UgbWF5IGhhdmUgYSBUTm9kZVxuICAgICAgICAgICAgICAvLyBpbiB0aGUgZGF0YSBzdHJ1Y3R1cmUgYXMgYSBwcm9qZWN0aW9uIHNlZ21lbnQgaGVhZCwgYnV0IHRoZVxuICAgICAgICAgICAgICAvLyBjb250ZW50IHByb2plY3Rpb24gc2xvdCBtaWdodCBiZSBkaXNhYmxlZCAoZS5nLlxuICAgICAgICAgICAgICAvLyA8bmctY29udGVudCAqbmdJZj1cImZhbHNlXCIgLz4pLlxuICAgICAgICAgICAgICBhcHBlbmREaXNjb25uZWN0ZWROb2RlSW5kZXgobmdoLCBwcm9qZWN0aW9uSGVhZFROb2RlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFwcGVuZFNlcmlhbGl6ZWROb2RlUGF0aChuZ2gsIHByb2plY3Rpb25IZWFkVE5vZGUsIGxWaWV3LCBpMThuQ2hpbGRyZW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJZiBhIHZhbHVlIGlzIGFuIGFycmF5LCBpdCBtZWFucyB0aGF0IHdlIGFyZSBwcm9jZXNzaW5nIGEgcHJvamVjdGlvblxuICAgICAgICAgIC8vIHdoZXJlIHByb2plY3RhYmxlIG5vZGVzIHdlcmUgcGFzc2VkIGluIGFzIERPTSBub2RlcyAoZm9yIGV4YW1wbGUsIHdoZW5cbiAgICAgICAgICAvLyBjYWxsaW5nIGBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudChDbXBBLCB7cHJvamVjdGFibGVOb2RlczogWy4uLl19KWApLlxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gSW4gdGhpcyBzY2VuYXJpbywgbm9kZXMgY2FuIGNvbWUgZnJvbSBhbnl3aGVyZSAoZWl0aGVyIGNyZWF0ZWQgbWFudWFsbHksXG4gICAgICAgICAgLy8gYWNjZXNzZWQgdmlhIGBkb2N1bWVudC5xdWVyeVNlbGVjdG9yYCwgZXRjKSBhbmQgbWF5IGJlIGluIGFueSBzdGF0ZVxuICAgICAgICAgIC8vIChhdHRhY2hlZCBvciBkZXRhY2hlZCBmcm9tIHRoZSBET00gdHJlZSkuIEFzIGEgcmVzdWx0LCB3ZSBjYW4gbm90IHJlbGlhYmx5XG4gICAgICAgICAgLy8gcmVzdG9yZSB0aGUgc3RhdGUgZm9yIHN1Y2ggY2FzZXMgZHVyaW5nIGh5ZHJhdGlvbi5cblxuICAgICAgICAgIHRocm93IHVuc3VwcG9ydGVkUHJvamVjdGlvbk9mRG9tTm9kZXModW53cmFwUk5vZGUobFZpZXdbaV0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbmRpdGlvbmFsbHlBbm5vdGF0ZU5vZGVQYXRoKG5naCwgdE5vZGUsIGxWaWV3LCBpMThuQ2hpbGRyZW4pO1xuXG4gICAgaWYgKGlzTENvbnRhaW5lcihsVmlld1tpXSkpIHtcbiAgICAgIC8vIFNlcmlhbGl6ZSBpbmZvcm1hdGlvbiBhYm91dCBhIHRlbXBsYXRlLlxuICAgICAgY29uc3QgZW1iZWRkZWRUVmlldyA9IHROb2RlLnRWaWV3O1xuICAgICAgaWYgKGVtYmVkZGVkVFZpZXcgIT09IG51bGwpIHtcbiAgICAgICAgbmdoW1RFTVBMQVRFU10gPz89IHt9O1xuICAgICAgICBuZ2hbVEVNUExBVEVTXVtub09mZnNldEluZGV4XSA9IGdldFNzcklkKGVtYmVkZGVkVFZpZXcpO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXJpYWxpemUgdmlld3Mgd2l0aGluIHRoaXMgTENvbnRhaW5lci5cbiAgICAgIGNvbnN0IGhvc3ROb2RlID0gbFZpZXdbaV1bSE9TVF0hOyAvLyBob3N0IG5vZGUgb2YgdGhpcyBjb250YWluZXJcblxuICAgICAgLy8gTFZpZXdbaV1bSE9TVF0gY2FuIGJlIG9mIDIgZGlmZmVyZW50IHR5cGVzOlxuICAgICAgLy8gLSBlaXRoZXIgYSBET00gbm9kZVxuICAgICAgLy8gLSBvciBhbiBhcnJheSB0aGF0IHJlcHJlc2VudHMgYW4gTFZpZXcgb2YgYSBjb21wb25lbnRcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGhvc3ROb2RlKSkge1xuICAgICAgICAvLyBUaGlzIGlzIGEgY29tcG9uZW50LCBzZXJpYWxpemUgaW5mbyBhYm91dCBpdC5cbiAgICAgICAgY29uc3QgdGFyZ2V0Tm9kZSA9IHVud3JhcFJOb2RlKGhvc3ROb2RlIGFzIExWaWV3KSBhcyBSRWxlbWVudDtcbiAgICAgICAgaWYgKCEodGFyZ2V0Tm9kZSBhcyBIVE1MRWxlbWVudCkuaGFzQXR0cmlidXRlKFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSkpIHtcbiAgICAgICAgICBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKHRhcmdldE5vZGUsIGhvc3ROb2RlIGFzIExWaWV3LCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBuZ2hbQ09OVEFJTkVSU10gPz89IHt9O1xuICAgICAgbmdoW0NPTlRBSU5FUlNdW25vT2Zmc2V0SW5kZXhdID0gc2VyaWFsaXplTENvbnRhaW5lcihsVmlld1tpXSwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGxWaWV3W2ldKSkge1xuICAgICAgLy8gVGhpcyBpcyBhIGNvbXBvbmVudCwgYW5ub3RhdGUgdGhlIGhvc3Qgbm9kZSB3aXRoIGFuIGBuZ2hgIGF0dHJpYnV0ZS5cbiAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSB1bndyYXBSTm9kZShsVmlld1tpXVtIT1NUXSEpO1xuICAgICAgaWYgKCEodGFyZ2V0Tm9kZSBhcyBIVE1MRWxlbWVudCkuaGFzQXR0cmlidXRlKFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSkpIHtcbiAgICAgICAgYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbih0YXJnZXROb2RlIGFzIFJFbGVtZW50LCBsVmlld1tpXSwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIDxuZy1jb250YWluZXI+IGNhc2VcbiAgICAgIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgICAgLy8gQW4gPG5nLWNvbnRhaW5lcj4gaXMgcmVwcmVzZW50ZWQgYnkgdGhlIG51bWJlciBvZlxuICAgICAgICAvLyB0b3AtbGV2ZWwgbm9kZXMuIFRoaXMgaW5mb3JtYXRpb24gaXMgbmVlZGVkIHRvIHNraXAgb3ZlclxuICAgICAgICAvLyB0aG9zZSBub2RlcyB0byByZWFjaCBhIGNvcnJlc3BvbmRpbmcgYW5jaG9yIG5vZGUgKGNvbW1lbnQgbm9kZSkuXG4gICAgICAgIG5naFtFTEVNRU5UX0NPTlRBSU5FUlNdID8/PSB7fTtcbiAgICAgICAgbmdoW0VMRU1FTlRfQ09OVEFJTkVSU11bbm9PZmZzZXRJbmRleF0gPSBjYWxjTnVtUm9vdE5vZGVzKHRWaWV3LCBsVmlldywgdE5vZGUuY2hpbGQpO1xuICAgICAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgKFROb2RlVHlwZS5Qcm9qZWN0aW9uIHwgVE5vZGVUeXBlLkxldERlY2xhcmF0aW9uKSkge1xuICAgICAgICAvLyBDdXJyZW50IFROb2RlIHJlcHJlc2VudHMgYW4gYDxuZy1jb250ZW50PmAgc2xvdCBvciBgQGxldGAgZGVjbGFyYXRpb24sXG4gICAgICAgIC8vIHRodXMgaXQgaGFzIG5vIERPTSBlbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggaXQsIHNvIHRoZSAqKm5leHQgc2libGluZyoqXG4gICAgICAgIC8vIG5vZGUgd291bGQgbm90IGJlIGFibGUgdG8gZmluZCBhbiBhbmNob3IuIEluIHRoaXMgY2FzZSwgdXNlIGZ1bGwgcGF0aCBpbnN0ZWFkLlxuICAgICAgICBsZXQgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcbiAgICAgICAgLy8gU2tpcCBvdmVyIGFsbCBgPG5nLWNvbnRlbnQ+YCBzbG90cyBhbmQgYEBsZXRgIGRlY2xhcmF0aW9ucyBpbiBhIHJvdy5cbiAgICAgICAgd2hpbGUgKFxuICAgICAgICAgIG5leHRUTm9kZSAhPT0gbnVsbCAmJlxuICAgICAgICAgIG5leHRUTm9kZS50eXBlICYgKFROb2RlVHlwZS5Qcm9qZWN0aW9uIHwgVE5vZGVUeXBlLkxldERlY2xhcmF0aW9uKVxuICAgICAgICApIHtcbiAgICAgICAgICBuZXh0VE5vZGUgPSBuZXh0VE5vZGUubmV4dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dFROb2RlICYmICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKG5leHRUTm9kZSkpIHtcbiAgICAgICAgICAvLyBIYW5kbGUgYSB0Tm9kZSBhZnRlciB0aGUgYDxuZy1jb250ZW50PmAgc2xvdC5cbiAgICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCBuZXh0VE5vZGUsIGxWaWV3LCBpMThuQ2hpbGRyZW4pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuVGV4dCkge1xuICAgICAgICBjb25zdCByTm9kZSA9IHVud3JhcFJOb2RlKGxWaWV3W2ldKTtcbiAgICAgICAgcHJvY2Vzc1RleHROb2RlQmVmb3JlU2VyaWFsaXphdGlvbihjb250ZXh0LCByTm9kZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuZ2g7XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyBub2RlIGxvY2F0aW9uIGluIGNhc2VzIHdoZW4gaXQncyBuZWVkZWQsIHNwZWNpZmljYWxseTpcbiAqXG4gKiAgMS4gSWYgYHROb2RlLnByb2plY3Rpb25OZXh0YCBpcyBkaWZmZXJlbnQgZnJvbSBgdE5vZGUubmV4dGAgLSBpdCBtZWFucyB0aGF0XG4gKiAgICAgdGhlIG5leHQgYHROb2RlYCBhZnRlciBwcm9qZWN0aW9uIGlzIGRpZmZlcmVudCBmcm9tIHRoZSBvbmUgaW4gdGhlIG9yaWdpbmFsXG4gKiAgICAgdGVtcGxhdGUuIFNpbmNlIGh5ZHJhdGlvbiByZWxpZXMgb24gYHROb2RlLm5leHRgLCB0aGlzIHNlcmlhbGl6ZWQgaW5mb1xuICogICAgIGlzIHJlcXVpcmVkIHRvIGhlbHAgcnVudGltZSBjb2RlIGZpbmQgdGhlIG5vZGUgYXQgdGhlIGNvcnJlY3QgbG9jYXRpb24uXG4gKiAgMi4gSW4gY2VydGFpbiBjb250ZW50IHByb2plY3Rpb24tYmFzZWQgdXNlLWNhc2VzLCBpdCdzIHBvc3NpYmxlIHRoYXQgb25seVxuICogICAgIGEgY29udGVudCBvZiBhIHByb2plY3RlZCBlbGVtZW50IGlzIHJlbmRlcmVkLiBJbiB0aGlzIGNhc2UsIGNvbnRlbnQgbm9kZXNcbiAqICAgICByZXF1aXJlIGFuIGV4dHJhIGFubm90YXRpb24sIHNpbmNlIHJ1bnRpbWUgbG9naWMgY2FuJ3QgcmVseSBvbiBwYXJlbnQtY2hpbGRcbiAqICAgICBjb25uZWN0aW9uIHRvIGlkZW50aWZ5IHRoZSBsb2NhdGlvbiBvZiBhIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGNvbmRpdGlvbmFsbHlBbm5vdGF0ZU5vZGVQYXRoKFxuICBuZ2g6IFNlcmlhbGl6ZWRWaWV3LFxuICB0Tm9kZTogVE5vZGUsXG4gIGxWaWV3OiBMVmlldzx1bmtub3duPixcbiAgZXhjbHVkZWRQYXJlbnROb2RlczogU2V0PG51bWJlcj4gfCBudWxsLFxuKSB7XG4gIC8vIEhhbmRsZSBjYXNlICMxIGRlc2NyaWJlZCBhYm92ZS5cbiAgaWYgKFxuICAgIHROb2RlLnByb2plY3Rpb25OZXh0ICYmXG4gICAgdE5vZGUucHJvamVjdGlvbk5leHQgIT09IHROb2RlLm5leHQgJiZcbiAgICAhaXNJblNraXBIeWRyYXRpb25CbG9jayh0Tm9kZS5wcm9qZWN0aW9uTmV4dClcbiAgKSB7XG4gICAgYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naCwgdE5vZGUucHJvamVjdGlvbk5leHQsIGxWaWV3LCBleGNsdWRlZFBhcmVudE5vZGVzKTtcbiAgfVxuXG4gIC8vIEhhbmRsZSBjYXNlICMyIGRlc2NyaWJlZCBhYm92ZS5cbiAgLy8gTm90ZTogd2Ugb25seSBkbyB0aGF0IGZvciB0aGUgZmlyc3Qgbm9kZSAoaS5lLiB3aGVuIGB0Tm9kZS5wcmV2ID09PSBudWxsYCksXG4gIC8vIHRoZSByZXN0IG9mIHRoZSBub2RlcyB3b3VsZCByZWx5IG9uIHRoZSBjdXJyZW50IG5vZGUgbG9jYXRpb24sIHNvIG5vIGV4dHJhXG4gIC8vIGFubm90YXRpb24gaXMgbmVlZGVkLlxuICBpZiAoXG4gICAgdE5vZGUucHJldiA9PT0gbnVsbCAmJlxuICAgIHROb2RlLnBhcmVudCAhPT0gbnVsbCAmJlxuICAgIGlzRGlzY29ubmVjdGVkTm9kZSh0Tm9kZS5wYXJlbnQsIGxWaWV3KSAmJlxuICAgICFpc0Rpc2Nvbm5lY3RlZE5vZGUodE5vZGUsIGxWaWV3KVxuICApIHtcbiAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCB0Tm9kZSwgbFZpZXcsIGV4Y2x1ZGVkUGFyZW50Tm9kZXMpO1xuICB9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgY29tcG9uZW50IGluc3RhbmNlIHRoYXQgaXMgcmVwcmVzZW50ZWRcbiAqIGJ5IGEgZ2l2ZW4gTFZpZXcgdXNlcyBgVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tYC5cbiAqL1xuZnVuY3Rpb24gY29tcG9uZW50VXNlc1NoYWRvd0RvbUVuY2Fwc3VsYXRpb24obFZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIGNvbnN0IGluc3RhbmNlID0gbFZpZXdbQ09OVEVYVF07XG4gIHJldHVybiBpbnN0YW5jZT8uY29uc3RydWN0b3JcbiAgICA/IGdldENvbXBvbmVudERlZihpbnN0YW5jZS5jb25zdHJ1Y3Rvcik/LmVuY2Fwc3VsYXRpb24gPT09IFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbVxuICAgIDogZmFsc2U7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgZm9yIGh5ZHJhdGlvbjpcbiAqIC0gYnkgZWl0aGVyIGFkZGluZyB0aGUgYG5naGAgYXR0cmlidXRlIGFuZCBjb2xsZWN0aW5nIGh5ZHJhdGlvbi1yZWxhdGVkIGluZm9cbiAqICAgZm9yIHRoZSBzZXJpYWxpemF0aW9uIGFuZCB0cmFuc2ZlcnJpbmcgdG8gdGhlIGNsaWVudFxuICogLSBvciBieSBhZGRpbmcgdGhlIGBuZ1NraXBIeWRyYXRpb25gIGF0dHJpYnV0ZSBpbiBjYXNlIEFuZ3VsYXIgZGV0ZWN0cyB0aGF0XG4gKiAgIGNvbXBvbmVudCBjb250ZW50cyBpcyBub3QgY29tcGF0aWJsZSB3aXRoIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgSG9zdCBlbGVtZW50IHRvIGJlIGFubm90YXRlZFxuICogQHBhcmFtIGxWaWV3IFRoZSBhc3NvY2lhdGVkIExWaWV3XG4gKiBAcGFyYW0gY29udGV4dCBUaGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIEFuIGluZGV4IG9mIHNlcmlhbGl6ZWQgdmlldyBmcm9tIHRoZSB0cmFuc2ZlciBzdGF0ZSBvYmplY3RcbiAqICAgICAgICAgIG9yIGBudWxsYCB3aGVuIGEgZ2l2ZW4gY29tcG9uZW50IGNhbiBub3QgYmUgc2VyaWFsaXplZC5cbiAqL1xuZnVuY3Rpb24gYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbihcbiAgZWxlbWVudDogUkVsZW1lbnQsXG4gIGxWaWV3OiBMVmlldyxcbiAgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCxcbik6IG51bWJlciB8IG51bGwge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgaWYgKFxuICAgIChoYXNJMThuKGxWaWV3KSAmJiAhaXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQoKSkgfHxcbiAgICBjb21wb25lbnRVc2VzU2hhZG93RG9tRW5jYXBzdWxhdGlvbihsVmlldylcbiAgKSB7XG4gICAgLy8gQXR0YWNoIHRoZSBza2lwIGh5ZHJhdGlvbiBhdHRyaWJ1dGUgaWYgdGhpcyBjb21wb25lbnQ6XG4gICAgLy8gLSBlaXRoZXIgaGFzIGkxOG4gYmxvY2tzLCBzaW5jZSBoeWRyYXRpbmcgc3VjaCBibG9ja3MgaXMgbm90IHlldCBzdXBwb3J0ZWRcbiAgICAvLyAtIG9yIHVzZXMgU2hhZG93RG9tIHZpZXcgZW5jYXBzdWxhdGlvbiwgc2luY2UgRG9taW5vIGRvZXNuJ3Qgc3VwcG9ydFxuICAgIC8vICAgc2hhZG93IERPTSwgc28gd2UgY2FuIG5vdCBndWFyYW50ZWUgdGhhdCBjbGllbnQgYW5kIHNlcnZlciByZXByZXNlbnRhdGlvbnNcbiAgICAvLyAgIHdvdWxkIGV4YWN0bHkgbWF0Y2hcbiAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FLCAnJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbmdoID0gc2VyaWFsaXplTFZpZXcobFZpZXcsIGNvbnRleHQpO1xuICAgIGNvbnN0IGluZGV4ID0gY29udGV4dC5zZXJpYWxpemVkVmlld0NvbGxlY3Rpb24uYWRkKG5naCk7XG4gICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIE5HSF9BVFRSX05BTUUsIGluZGV4LnRvU3RyaW5nKCkpO1xuICAgIHJldHVybiBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIFBoeXNpY2FsbHkgaW5zZXJ0cyB0aGUgY29tbWVudCBub2RlcyB0byBlbnN1cmUgZW1wdHkgdGV4dCBub2RlcyBhbmQgYWRqYWNlbnRcbiAqIHRleHQgbm9kZSBzZXBhcmF0b3JzIGFyZSBwcmVzZXJ2ZWQgYWZ0ZXIgc2VydmVyIHNlcmlhbGl6YXRpb24gb2YgdGhlIERPTS5cbiAqIFRoZXNlIGdldCBzd2FwcGVkIGJhY2sgZm9yIGVtcHR5IHRleHQgbm9kZXMgb3Igc2VwYXJhdG9ycyBvbmNlIGh5ZHJhdGlvbiBoYXBwZW5zXG4gKiBvbiB0aGUgY2xpZW50LlxuICpcbiAqIEBwYXJhbSBjb3JydXB0ZWRUZXh0Tm9kZXMgVGhlIE1hcCBvZiB0ZXh0IG5vZGVzIHRvIGJlIHJlcGxhY2VkIHdpdGggY29tbWVudHNcbiAqIEBwYXJhbSBkb2MgVGhlIGRvY3VtZW50XG4gKi9cbmZ1bmN0aW9uIGluc2VydENvcnJ1cHRlZFRleHROb2RlTWFya2VycyhcbiAgY29ycnVwdGVkVGV4dE5vZGVzOiBNYXA8SFRNTEVsZW1lbnQsIHN0cmluZz4sXG4gIGRvYzogRG9jdW1lbnQsXG4pIHtcbiAgZm9yIChjb25zdCBbdGV4dE5vZGUsIG1hcmtlcl0gb2YgY29ycnVwdGVkVGV4dE5vZGVzKSB7XG4gICAgdGV4dE5vZGUuYWZ0ZXIoZG9jLmNyZWF0ZUNvbW1lbnQobWFya2VyKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlY3RzIHdoZXRoZXIgYSBnaXZlbiBUTm9kZSByZXByZXNlbnRzIGEgbm9kZSB0aGF0XG4gKiBpcyBiZWluZyBjb250ZW50IHByb2plY3RlZC5cbiAqL1xuZnVuY3Rpb24gaXNDb250ZW50UHJvamVjdGVkTm9kZSh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgbGV0IGN1cnJlbnRUTm9kZSA9IHROb2RlO1xuICB3aGlsZSAoY3VycmVudFROb2RlICE9IG51bGwpIHtcbiAgICAvLyBJZiB3ZSBjb21lIGFjcm9zcyBhIGNvbXBvbmVudCBob3N0IG5vZGUgaW4gcGFyZW50IG5vZGVzIC1cbiAgICAvLyB0aGlzIFROb2RlIGlzIGluIHRoZSBjb250ZW50IHByb2plY3Rpb24gc2VjdGlvbi5cbiAgICBpZiAoaXNDb21wb25lbnRIb3N0KGN1cnJlbnRUTm9kZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjdXJyZW50VE5vZGUgPSBjdXJyZW50VE5vZGUucGFyZW50IGFzIFROb2RlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==