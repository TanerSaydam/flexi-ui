/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @fileoverview Implements the local event handling contract. This
 * allows DOM objects in a container that enters into this contract to
 * define event handlers which are executed in a local context.
 *
 * One EventContract instance can manage the contract for multiple
 * containers, which are added using the addContainer() method.
 *
 * Events can be registered using the addEvent() method.
 *
 * A Dispatcher is added using the registerDispatcher() method. Until there is
 * a dispatcher, events are queued. The idea is that the EventContract
 * class is inlined in the HTML of the top level page and instantiated
 * right after the start of <body>. The Dispatcher class is contained
 * in the external deferred js, and instantiated and registered with
 * EventContract when the external javascript in the page loads. The
 * external javascript will also register the jsaction handlers, which
 * then pick up the queued events at the time of registration.
 *
 * Since this class is meant to be inlined in the main page HTML, the
 * size of the binary compiled from this file MUST be kept as small as
 * possible and thus its dependencies to a minimum.
 */
import * as a11yClickLib from './a11y_click';
import { ActionResolver } from './action_resolver';
import * as eventLib from './event';
import { A11Y_CLICK_SUPPORT, MOUSE_SPECIAL_SUPPORT } from './event_contract_defines';
import * as eventInfoLib from './event_info';
import { EventType, NON_BUBBLING_MOUSE_EVENTS } from './event_type';
/**
 * EventContract intercepts events in the bubbling phase at the
 * boundary of a container element, and maps them to generic actions
 * which are specified using the custom jsaction attribute in
 * HTML. Behavior of the application is then specified in terms of
 * handler for such actions, cf. jsaction.Dispatcher in dispatcher.js.
 *
 * This has several benefits: (1) No DOM event handlers need to be
 * registered on the specific elements in the UI. (2) The set of
 * events that the application has to handle can be specified in terms
 * of the semantics of the application, rather than in terms of DOM
 * events. (3) Invocation of handlers can be delayed and handlers can
 * be delay loaded in a generic way.
 */
export class EventContract {
    static { this.A11Y_CLICK_SUPPORT = A11Y_CLICK_SUPPORT; }
    static { this.MOUSE_SPECIAL_SUPPORT = MOUSE_SPECIAL_SUPPORT; }
    constructor(containerManager, useActionResolver) {
        this.useActionResolver = useActionResolver;
        /**
         * The DOM events which this contract covers. Used to prevent double
         * registration of event types. The value of the map is the
         * internally created DOM event handler function that handles the
         * DOM events. See addEvent().
         *
         */
        this.eventHandlers = {};
        this.browserEventTypeToExtraEventTypes = {};
        /**
         * The dispatcher function. Events are passed to this function for
         * handling once it was set using the registerDispatcher() method. This is
         * done because the function is passed from another jsbinary, so passing the
         * instance and invoking the method here would require to leave the method
         * unobfuscated.
         */
        this.dispatcher = null;
        /**
         * The list of suspended `EventInfo` that will be dispatched
         * as soon as the `Dispatcher` is registered.
         */
        this.queuedEventInfos = [];
        /** Whether to add an a11y click listener. */
        this.addA11yClickListener = false;
        this.containerManager = containerManager;
        if (this.useActionResolver) {
            this.actionResolver = new ActionResolver({
                syntheticMouseEventSupport: EventContract.MOUSE_SPECIAL_SUPPORT,
            });
        }
        if (EventContract.A11Y_CLICK_SUPPORT) {
            // Add a11y click support to the `EventContract`.
            this.addA11yClickSupport();
        }
    }
    handleEvent(eventType, event, container) {
        const eventInfo = eventInfoLib.createEventInfoFromParameters(
        /* eventType= */ eventType, 
        /* event= */ event, 
        /* targetElement= */ event.target, 
        /* container= */ container, 
        /* timestamp= */ Date.now());
        this.handleEventInfo(eventInfo);
    }
    /**
     * Handle an `EventInfo`.
     */
    handleEventInfo(eventInfo) {
        if (!this.dispatcher) {
            // All events are queued when the dispatcher isn't yet loaded.
            eventInfoLib.setIsReplay(eventInfo, true);
            this.queuedEventInfos?.push(eventInfo);
            return;
        }
        if (this.useActionResolver) {
            this.actionResolver.resolveEventType(eventInfo);
            this.actionResolver.resolveAction(eventInfo);
        }
        this.dispatcher(eventInfo);
    }
    /**
     * Enables jsaction handlers to be called for the event type given by
     * name.
     *
     * If the event is already registered, this does nothing.
     *
     * @param prefixedEventType If supplied, this event is used in
     *     the actual browser event registration instead of the name that is
     *     exposed to jsaction. Use this if you e.g. want users to be able
     *     to subscribe to jsaction="transitionEnd:foo" while the underlying
     *     event is webkitTransitionEnd in one browser and mozTransitionEnd
     *     in another.
     */
    addEvent(eventType, prefixedEventType) {
        if (eventType in this.eventHandlers || !this.containerManager) {
            return;
        }
        if (!EventContract.MOUSE_SPECIAL_SUPPORT && NON_BUBBLING_MOUSE_EVENTS.indexOf(eventType) >= 0) {
            return;
        }
        const eventHandler = (eventType, event, container) => {
            this.handleEvent(eventType, event, container);
        };
        // Store the callback to allow us to replay events.
        this.eventHandlers[eventType] = eventHandler;
        const browserEventType = eventLib.getBrowserEventType(prefixedEventType || eventType);
        if (browserEventType !== eventType) {
            const eventTypes = this.browserEventTypeToExtraEventTypes[browserEventType] || [];
            eventTypes.push(eventType);
            this.browserEventTypeToExtraEventTypes[browserEventType] = eventTypes;
        }
        this.containerManager.addEventListener(browserEventType, (element) => {
            return (event) => {
                eventHandler(eventType, event, element);
            };
        });
        // Automatically install a keypress/keydown event handler if support for
        // accessible clicks is turned on.
        if (this.addA11yClickListener && eventType === EventType.CLICK) {
            this.addEvent(EventType.KEYDOWN);
        }
    }
    /**
     * Gets the queued early events and replay them using the appropriate handler
     * in the provided event contract. Once all the events are replayed, it cleans
     * up the early contract.
     */
    replayEarlyEvents(earlyJsactionContainer = window) {
        // Check if the early contract is present and prevent calling this function
        // more than once.
        const earlyJsactionData = earlyJsactionContainer._ejsa;
        if (!earlyJsactionData) {
            return;
        }
        // Replay the early contract events.
        const earlyEventInfos = earlyJsactionData.q;
        for (let idx = 0; idx < earlyEventInfos.length; idx++) {
            const earlyEventInfo = earlyEventInfos[idx];
            const eventTypes = this.getEventTypesForBrowserEventType(earlyEventInfo.eventType);
            for (let i = 0; i < eventTypes.length; i++) {
                const eventInfo = eventInfoLib.cloneEventInfo(earlyEventInfo);
                // EventInfo eventType maps to JSAction's internal event type,
                // rather than the browser event type.
                eventInfoLib.setEventType(eventInfo, eventTypes[i]);
                this.handleEventInfo(eventInfo);
            }
        }
        // Clean up the early contract.
        const earlyEventHandler = earlyJsactionData.h;
        removeEventListeners(earlyJsactionData.c, earlyJsactionData.et, earlyEventHandler);
        removeEventListeners(earlyJsactionData.c, earlyJsactionData.etc, earlyEventHandler, true);
        delete earlyJsactionContainer._ejsa;
    }
    /**
     * Returns all JSAction event types that have been registered for a given
     * browser event type.
     */
    getEventTypesForBrowserEventType(browserEventType) {
        const eventTypes = [];
        if (this.eventHandlers[browserEventType]) {
            eventTypes.push(browserEventType);
        }
        if (this.browserEventTypeToExtraEventTypes[browserEventType]) {
            eventTypes.push(...this.browserEventTypeToExtraEventTypes[browserEventType]);
        }
        return eventTypes;
    }
    /**
     * Returns the event handler function for a given event type.
     */
    handler(eventType) {
        return this.eventHandlers[eventType];
    }
    /**
     * Cleans up the event contract. This resets all of the `EventContract`'s
     * internal state. Users are responsible for not using this `EventContract`
     * after it has been cleaned up.
     */
    cleanUp() {
        this.containerManager.cleanUp();
        this.containerManager = null;
        this.eventHandlers = {};
        this.browserEventTypeToExtraEventTypes = {};
        this.dispatcher = null;
        this.queuedEventInfos = [];
    }
    /**
     * Register a dispatcher function. Event info of each event mapped to
     * a jsaction is passed for handling to this callback. The queued
     * events are passed as well to the dispatcher for later replaying
     * once the dispatcher is registered. Clears the event queue to null.
     *
     * @param dispatcher The dispatcher function.
     * @param restriction
     */
    registerDispatcher(dispatcher, restriction) {
        this.ecrd(dispatcher, restriction);
    }
    /**
     * Unrenamed alias for registerDispatcher. Necessary for any codebases that
     * split the `EventContract` and `Dispatcher` code into different compilation
     * units.
     */
    ecrd(dispatcher, restriction) {
        this.dispatcher = dispatcher;
        if (this.queuedEventInfos?.length) {
            for (let i = 0; i < this.queuedEventInfos.length; i++) {
                this.handleEventInfo(this.queuedEventInfos[i]);
            }
            this.queuedEventInfos = null;
        }
    }
    /**
     * Adds a11y click support to the given `EventContract`. Meant to be called in
     * the same compilation unit as the `EventContract`.
     */
    addA11yClickSupport() {
        this.addA11yClickSupportImpl(a11yClickLib.updateEventInfoForA11yClick, a11yClickLib.preventDefaultForA11yClick, a11yClickLib.populateClickOnlyAction);
    }
    /**
     * Enables a11y click support to be deferred. Meant to be called in the same
     * compilation unit as the `EventContract`.
     */
    exportAddA11yClickSupport() {
        this.addA11yClickListener = true;
        this.ecaacs = this.addA11yClickSupportImpl.bind(this);
    }
    /**
     * Unrenamed function that loads a11yClickSupport.
     */
    addA11yClickSupportImpl(updateEventInfoForA11yClick, preventDefaultForA11yClick, populateClickOnlyAction) {
        this.addA11yClickListener = true;
        if (this.useActionResolver) {
            this.actionResolver.addA11yClickSupport(updateEventInfoForA11yClick, preventDefaultForA11yClick, populateClickOnlyAction);
        }
    }
}
function removeEventListeners(container, eventTypes, earlyEventHandler, capture) {
    for (let idx = 0; idx < eventTypes.length; idx++) {
        container.removeEventListener(eventTypes[idx], earlyEventHandler, /* useCapture */ capture);
    }
}
/**
 * Adds a11y click support to the given `EventContract`. Meant to be called
 * in a different compilation unit from the `EventContract`. The `EventContract`
 * must have called `exportAddA11yClickSupport` in its compilation unit for this
 * to have any effect.
 */
export function addDeferredA11yClickSupport(eventContract) {
    eventContract.ecaacs?.(a11yClickLib.updateEventInfoForA11yClick, a11yClickLib.preventDefaultForA11yClick, a11yClickLib.populateClickOnlyAction);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRjb250cmFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZXZlbnRjb250cmFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUVILE9BQU8sS0FBSyxZQUFZLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVqRCxPQUFPLEtBQUssUUFBUSxNQUFNLFNBQVMsQ0FBQztBQUVwQyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNuRixPQUFPLEtBQUssWUFBWSxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFFLHlCQUF5QixFQUFDLE1BQU0sY0FBYyxDQUFDO0FBK0JsRTs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsTUFBTSxPQUFPLGFBQWE7YUFDakIsdUJBQWtCLEdBQUcsa0JBQWtCLEFBQXJCLENBQXNCO2FBQ3hDLDBCQUFxQixHQUFHLHFCQUFxQixBQUF4QixDQUF5QjtJQXlDckQsWUFDRSxnQkFBK0MsRUFDOUIsaUJBQXdCO1FBQXhCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBTztRQXJDM0M7Ozs7OztXQU1HO1FBQ0ssa0JBQWEsR0FBa0MsRUFBRSxDQUFDO1FBRWxELHNDQUFpQyxHQUE4QixFQUFFLENBQUM7UUFFMUU7Ozs7OztXQU1HO1FBQ0ssZUFBVSxHQUFzQixJQUFJLENBQUM7UUFFN0M7OztXQUdHO1FBQ0sscUJBQWdCLEdBQW9DLEVBQUUsQ0FBQztRQUUvRCw2Q0FBNkM7UUFDckMseUJBQW9CLEdBQUcsS0FBSyxDQUFDO1FBWW5DLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztRQUN6QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxjQUFjLENBQUM7Z0JBQ3ZDLDBCQUEwQixFQUFFLGFBQWEsQ0FBQyxxQkFBcUI7YUFDaEUsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUNELElBQUksYUFBYSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDckMsaURBQWlEO1lBQ2pELElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQzdCLENBQUM7SUFDSCxDQUFDO0lBRU8sV0FBVyxDQUFDLFNBQWlCLEVBQUUsS0FBWSxFQUFFLFNBQWtCO1FBQ3JFLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyw2QkFBNkI7UUFDMUQsZ0JBQWdCLENBQUMsU0FBUztRQUMxQixZQUFZLENBQUMsS0FBSztRQUNsQixvQkFBb0IsQ0FBQyxLQUFLLENBQUMsTUFBaUI7UUFDNUMsZ0JBQWdCLENBQUMsU0FBUztRQUMxQixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQzVCLENBQUM7UUFDRixJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRDs7T0FFRztJQUNLLGVBQWUsQ0FBQyxTQUFpQztRQUN2RCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3JCLDhEQUE4RDtZQUM5RCxZQUFZLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZDLE9BQU87UUFDVCxDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUMzQixJQUFJLENBQUMsY0FBZSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxjQUFlLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFDRCxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxRQUFRLENBQUMsU0FBaUIsRUFBRSxpQkFBMEI7UUFDcEQsSUFBSSxTQUFTLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzlELE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsSUFBSSx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDOUYsT0FBTztRQUNULENBQUM7UUFFRCxNQUFNLFlBQVksR0FBRyxDQUFDLFNBQWlCLEVBQUUsS0FBWSxFQUFFLFNBQWtCLEVBQUUsRUFBRTtZQUMzRSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDaEQsQ0FBQyxDQUFDO1FBRUYsbURBQW1EO1FBQ25ELElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsWUFBWSxDQUFDO1FBRTdDLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLG1CQUFtQixDQUFDLGlCQUFpQixJQUFJLFNBQVMsQ0FBQyxDQUFDO1FBRXRGLElBQUksZ0JBQWdCLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDbkMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2xGLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsVUFBVSxDQUFDO1FBQ3hFLENBQUM7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxPQUFnQixFQUFFLEVBQUU7WUFDNUUsT0FBTyxDQUFDLEtBQVksRUFBRSxFQUFFO2dCQUN0QixZQUFZLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILHdFQUF3RTtRQUN4RSxrQ0FBa0M7UUFDbEMsSUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksU0FBUyxLQUFLLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMvRCxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuQyxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxpQkFBaUIsQ0FDZix5QkFBcUQsTUFBb0M7UUFFekYsMkVBQTJFO1FBQzNFLGtCQUFrQjtRQUNsQixNQUFNLGlCQUFpQixHQUFrQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7UUFDdEYsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDdkIsT0FBTztRQUNULENBQUM7UUFFRCxvQ0FBb0M7UUFDcEMsTUFBTSxlQUFlLEdBQTZCLGlCQUFpQixDQUFDLENBQUMsQ0FBQztRQUN0RSxLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsZUFBZSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDO1lBQ3RELE1BQU0sY0FBYyxHQUEyQixlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDcEUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNuRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUMzQyxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUM5RCw4REFBOEQ7Z0JBQzlELHNDQUFzQztnQkFDdEMsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BELElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbEMsQ0FBQztRQUNILENBQUM7UUFFRCwrQkFBK0I7UUFDL0IsTUFBTSxpQkFBaUIsR0FBMkIsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUNuRixvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsR0FBRyxFQUFFLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzFGLE9BQU8sc0JBQXNCLENBQUMsS0FBSyxDQUFDO0lBQ3RDLENBQUM7SUFFRDs7O09BR0c7SUFDSyxnQ0FBZ0MsQ0FBQyxnQkFBd0I7UUFDL0QsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3RCLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7WUFDekMsVUFBVSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFDRCxJQUFJLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7WUFDN0QsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDL0UsQ0FBQztRQUNELE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7T0FFRztJQUNILE9BQU8sQ0FBQyxTQUFpQjtRQUN2QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxPQUFPO1FBQ0wsSUFBSSxDQUFDLGdCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7UUFDN0IsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLGlDQUFpQyxHQUFHLEVBQUUsQ0FBQztRQUM1QyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN2QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILGtCQUFrQixDQUFDLFVBQXNCLEVBQUUsV0FBd0I7UUFDakUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxJQUFJLENBQUMsVUFBc0IsRUFBRSxXQUF3QjtRQUNuRCxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUU3QixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLEVBQUUsQ0FBQztZQUNsQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN0RCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFDRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1FBQy9CLENBQUM7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsbUJBQW1CO1FBQ2pCLElBQUksQ0FBQyx1QkFBdUIsQ0FDMUIsWUFBWSxDQUFDLDJCQUEyQixFQUN4QyxZQUFZLENBQUMsMEJBQTBCLEVBQ3ZDLFlBQVksQ0FBQyx1QkFBdUIsQ0FDckMsQ0FBQztJQUNKLENBQUM7SUFFRDs7O09BR0c7SUFDSCx5QkFBeUI7UUFDdkIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztRQUNqQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVEOztPQUVHO0lBQ0ssdUJBQXVCLENBQzdCLDJCQUE0RSxFQUM1RSwwQkFBMEUsRUFDMUUsdUJBQW9FO1FBRXBFLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7UUFDakMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUMzQixJQUFJLENBQUMsY0FBZSxDQUFDLG1CQUFtQixDQUN0QywyQkFBMkIsRUFDM0IsMEJBQTBCLEVBQzFCLHVCQUF1QixDQUN4QixDQUFDO1FBQ0osQ0FBQztJQUNILENBQUM7O0FBR0gsU0FBUyxvQkFBb0IsQ0FDM0IsU0FBc0IsRUFDdEIsVUFBb0IsRUFDcEIsaUJBQXFDLEVBQ3JDLE9BQWlCO0lBRWpCLEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUM7UUFDakQsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5RixDQUFDO0FBQ0gsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLDJCQUEyQixDQUFDLGFBQTRCO0lBQ3RFLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FDcEIsWUFBWSxDQUFDLDJCQUEyQixFQUN4QyxZQUFZLENBQUMsMEJBQTBCLEVBQ3ZDLFlBQVksQ0FBQyx1QkFBdUIsQ0FDckMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEltcGxlbWVudHMgdGhlIGxvY2FsIGV2ZW50IGhhbmRsaW5nIGNvbnRyYWN0LiBUaGlzXG4gKiBhbGxvd3MgRE9NIG9iamVjdHMgaW4gYSBjb250YWluZXIgdGhhdCBlbnRlcnMgaW50byB0aGlzIGNvbnRyYWN0IHRvXG4gKiBkZWZpbmUgZXZlbnQgaGFuZGxlcnMgd2hpY2ggYXJlIGV4ZWN1dGVkIGluIGEgbG9jYWwgY29udGV4dC5cbiAqXG4gKiBPbmUgRXZlbnRDb250cmFjdCBpbnN0YW5jZSBjYW4gbWFuYWdlIHRoZSBjb250cmFjdCBmb3IgbXVsdGlwbGVcbiAqIGNvbnRhaW5lcnMsIHdoaWNoIGFyZSBhZGRlZCB1c2luZyB0aGUgYWRkQ29udGFpbmVyKCkgbWV0aG9kLlxuICpcbiAqIEV2ZW50cyBjYW4gYmUgcmVnaXN0ZXJlZCB1c2luZyB0aGUgYWRkRXZlbnQoKSBtZXRob2QuXG4gKlxuICogQSBEaXNwYXRjaGVyIGlzIGFkZGVkIHVzaW5nIHRoZSByZWdpc3RlckRpc3BhdGNoZXIoKSBtZXRob2QuIFVudGlsIHRoZXJlIGlzXG4gKiBhIGRpc3BhdGNoZXIsIGV2ZW50cyBhcmUgcXVldWVkLiBUaGUgaWRlYSBpcyB0aGF0IHRoZSBFdmVudENvbnRyYWN0XG4gKiBjbGFzcyBpcyBpbmxpbmVkIGluIHRoZSBIVE1MIG9mIHRoZSB0b3AgbGV2ZWwgcGFnZSBhbmQgaW5zdGFudGlhdGVkXG4gKiByaWdodCBhZnRlciB0aGUgc3RhcnQgb2YgPGJvZHk+LiBUaGUgRGlzcGF0Y2hlciBjbGFzcyBpcyBjb250YWluZWRcbiAqIGluIHRoZSBleHRlcm5hbCBkZWZlcnJlZCBqcywgYW5kIGluc3RhbnRpYXRlZCBhbmQgcmVnaXN0ZXJlZCB3aXRoXG4gKiBFdmVudENvbnRyYWN0IHdoZW4gdGhlIGV4dGVybmFsIGphdmFzY3JpcHQgaW4gdGhlIHBhZ2UgbG9hZHMuIFRoZVxuICogZXh0ZXJuYWwgamF2YXNjcmlwdCB3aWxsIGFsc28gcmVnaXN0ZXIgdGhlIGpzYWN0aW9uIGhhbmRsZXJzLCB3aGljaFxuICogdGhlbiBwaWNrIHVwIHRoZSBxdWV1ZWQgZXZlbnRzIGF0IHRoZSB0aW1lIG9mIHJlZ2lzdHJhdGlvbi5cbiAqXG4gKiBTaW5jZSB0aGlzIGNsYXNzIGlzIG1lYW50IHRvIGJlIGlubGluZWQgaW4gdGhlIG1haW4gcGFnZSBIVE1MLCB0aGVcbiAqIHNpemUgb2YgdGhlIGJpbmFyeSBjb21waWxlZCBmcm9tIHRoaXMgZmlsZSBNVVNUIGJlIGtlcHQgYXMgc21hbGwgYXNcbiAqIHBvc3NpYmxlIGFuZCB0aHVzIGl0cyBkZXBlbmRlbmNpZXMgdG8gYSBtaW5pbXVtLlxuICovXG5cbmltcG9ydCAqIGFzIGExMXlDbGlja0xpYiBmcm9tICcuL2ExMXlfY2xpY2snO1xuaW1wb3J0IHtBY3Rpb25SZXNvbHZlcn0gZnJvbSAnLi9hY3Rpb25fcmVzb2x2ZXInO1xuaW1wb3J0IHtFYXJseUpzYWN0aW9uRGF0YSwgRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXJ9IGZyb20gJy4vZWFybHlldmVudGNvbnRyYWN0JztcbmltcG9ydCAqIGFzIGV2ZW50TGliIGZyb20gJy4vZXZlbnQnO1xuaW1wb3J0IHtFdmVudENvbnRyYWN0Q29udGFpbmVyTWFuYWdlcn0gZnJvbSAnLi9ldmVudF9jb250cmFjdF9jb250YWluZXInO1xuaW1wb3J0IHtBMTFZX0NMSUNLX1NVUFBPUlQsIE1PVVNFX1NQRUNJQUxfU1VQUE9SVH0gZnJvbSAnLi9ldmVudF9jb250cmFjdF9kZWZpbmVzJztcbmltcG9ydCAqIGFzIGV2ZW50SW5mb0xpYiBmcm9tICcuL2V2ZW50X2luZm8nO1xuaW1wb3J0IHtFdmVudFR5cGUsIE5PTl9CVUJCTElOR19NT1VTRV9FVkVOVFN9IGZyb20gJy4vZXZlbnRfdHlwZSc7XG5pbXBvcnQge1Jlc3RyaWN0aW9ufSBmcm9tICcuL3Jlc3RyaWN0aW9uJztcblxuLyoqXG4gKiBUaGUgQVBJIG9mIGFuIEV2ZW50Q29udHJhY3QgdGhhdCBpcyBzYWZlIHRvIGNhbGwgZnJvbSBhbnkgY29tcGlsYXRpb24gdW5pdC5cbiAqL1xuZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIFVucmVuYW1lZEV2ZW50Q29udHJhY3Qge1xuICAvLyBBbGlhcyBmb3IgSnNjdGlvbiBFdmVudENvbnRyYWN0IHJlZ2lzdGVyRGlzcGF0Y2hlci5cbiAgZWNyZChkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLCByZXN0cmljdGlvbjogUmVzdHJpY3Rpb24pOiB2b2lkO1xuICAvLyBVbnJlbmFtZWQgZnVuY3Rpb24uIEFiYnJldmlhdGlvbiBmb3IgYGV2ZW50Q29udHJhY3QuYWRkQTExeUNsaWNrU3VwcG9ydGAuXG4gIGVjYWFjcz86IChcbiAgICB1cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgIHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgIHBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uOiB0eXBlb2YgYTExeUNsaWNrTGliLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICApID0+IHZvaWQ7XG59XG5cbi8qKiBBIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHRvIGhhbmRsZSBldmVudHMgY2FwdHVyZWQgYnkgdGhlIEV2ZW50Q29udHJhY3QuICovXG5leHBvcnQgdHlwZSBEaXNwYXRjaGVyID0gKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbywgZ2xvYmFsRGlzcGF0Y2g/OiBib29sZWFuKSA9PiB2b2lkO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIGFuIGV2ZW50IGRpc3BhdGNoZWQgZnJvbSB0aGUgYnJvd3Nlci5cbiAqXG4gKiBldmVudFR5cGU6IE1heSBkaWZmZXIgZnJvbSBgZXZlbnQudHlwZWAgaWYgSlNBY3Rpb24gdXNlcyBhXG4gKiBzaG9ydC1oYW5kIG5hbWUgb3IgaXMgcGF0Y2hpbmcgb3ZlciBhbiBub24tYnViYmxpbmcgZXZlbnQgd2l0aCBhIGJ1YmJsaW5nXG4gKiB2YXJpYW50LlxuICogZXZlbnQ6IFRoZSBuYXRpdmUgYnJvd3NlciBldmVudC5cbiAqIGNvbnRhaW5lcjogVGhlIGNvbnRhaW5lciBmb3IgdGhpcyBkaXNwYXRjaC5cbiAqL1xudHlwZSBFdmVudEhhbmRsZXIgPSAoZXZlbnRUeXBlOiBzdHJpbmcsIGV2ZW50OiBFdmVudCwgY29udGFpbmVyOiBFbGVtZW50KSA9PiB2b2lkO1xuXG4vKipcbiAqIEV2ZW50Q29udHJhY3QgaW50ZXJjZXB0cyBldmVudHMgaW4gdGhlIGJ1YmJsaW5nIHBoYXNlIGF0IHRoZVxuICogYm91bmRhcnkgb2YgYSBjb250YWluZXIgZWxlbWVudCwgYW5kIG1hcHMgdGhlbSB0byBnZW5lcmljIGFjdGlvbnNcbiAqIHdoaWNoIGFyZSBzcGVjaWZpZWQgdXNpbmcgdGhlIGN1c3RvbSBqc2FjdGlvbiBhdHRyaWJ1dGUgaW5cbiAqIEhUTUwuIEJlaGF2aW9yIG9mIHRoZSBhcHBsaWNhdGlvbiBpcyB0aGVuIHNwZWNpZmllZCBpbiB0ZXJtcyBvZlxuICogaGFuZGxlciBmb3Igc3VjaCBhY3Rpb25zLCBjZi4ganNhY3Rpb24uRGlzcGF0Y2hlciBpbiBkaXNwYXRjaGVyLmpzLlxuICpcbiAqIFRoaXMgaGFzIHNldmVyYWwgYmVuZWZpdHM6ICgxKSBObyBET00gZXZlbnQgaGFuZGxlcnMgbmVlZCB0byBiZVxuICogcmVnaXN0ZXJlZCBvbiB0aGUgc3BlY2lmaWMgZWxlbWVudHMgaW4gdGhlIFVJLiAoMikgVGhlIHNldCBvZlxuICogZXZlbnRzIHRoYXQgdGhlIGFwcGxpY2F0aW9uIGhhcyB0byBoYW5kbGUgY2FuIGJlIHNwZWNpZmllZCBpbiB0ZXJtc1xuICogb2YgdGhlIHNlbWFudGljcyBvZiB0aGUgYXBwbGljYXRpb24sIHJhdGhlciB0aGFuIGluIHRlcm1zIG9mIERPTVxuICogZXZlbnRzLiAoMykgSW52b2NhdGlvbiBvZiBoYW5kbGVycyBjYW4gYmUgZGVsYXllZCBhbmQgaGFuZGxlcnMgY2FuXG4gKiBiZSBkZWxheSBsb2FkZWQgaW4gYSBnZW5lcmljIHdheS5cbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50Q29udHJhY3QgaW1wbGVtZW50cyBVbnJlbmFtZWRFdmVudENvbnRyYWN0IHtcbiAgc3RhdGljIEExMVlfQ0xJQ0tfU1VQUE9SVCA9IEExMVlfQ0xJQ0tfU1VQUE9SVDtcbiAgc3RhdGljIE1PVVNFX1NQRUNJQUxfU1VQUE9SVCA9IE1PVVNFX1NQRUNJQUxfU1VQUE9SVDtcblxuICBwcml2YXRlIGNvbnRhaW5lck1hbmFnZXI6IEV2ZW50Q29udHJhY3RDb250YWluZXJNYW5hZ2VyIHwgbnVsbDtcblxuICBwcml2YXRlIHJlYWRvbmx5IGFjdGlvblJlc29sdmVyPzogQWN0aW9uUmVzb2x2ZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBET00gZXZlbnRzIHdoaWNoIHRoaXMgY29udHJhY3QgY292ZXJzLiBVc2VkIHRvIHByZXZlbnQgZG91YmxlXG4gICAqIHJlZ2lzdHJhdGlvbiBvZiBldmVudCB0eXBlcy4gVGhlIHZhbHVlIG9mIHRoZSBtYXAgaXMgdGhlXG4gICAqIGludGVybmFsbHkgY3JlYXRlZCBET00gZXZlbnQgaGFuZGxlciBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgdGhlXG4gICAqIERPTSBldmVudHMuIFNlZSBhZGRFdmVudCgpLlxuICAgKlxuICAgKi9cbiAgcHJpdmF0ZSBldmVudEhhbmRsZXJzOiB7W2tleTogc3RyaW5nXTogRXZlbnRIYW5kbGVyfSA9IHt9O1xuXG4gIHByaXZhdGUgYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nW119ID0ge307XG5cbiAgLyoqXG4gICAqIFRoZSBkaXNwYXRjaGVyIGZ1bmN0aW9uLiBFdmVudHMgYXJlIHBhc3NlZCB0byB0aGlzIGZ1bmN0aW9uIGZvclxuICAgKiBoYW5kbGluZyBvbmNlIGl0IHdhcyBzZXQgdXNpbmcgdGhlIHJlZ2lzdGVyRGlzcGF0Y2hlcigpIG1ldGhvZC4gVGhpcyBpc1xuICAgKiBkb25lIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIHBhc3NlZCBmcm9tIGFub3RoZXIganNiaW5hcnksIHNvIHBhc3NpbmcgdGhlXG4gICAqIGluc3RhbmNlIGFuZCBpbnZva2luZyB0aGUgbWV0aG9kIGhlcmUgd291bGQgcmVxdWlyZSB0byBsZWF2ZSB0aGUgbWV0aG9kXG4gICAqIHVub2JmdXNjYXRlZC5cbiAgICovXG4gIHByaXZhdGUgZGlzcGF0Y2hlcjogRGlzcGF0Y2hlciB8IG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCBvZiBzdXNwZW5kZWQgYEV2ZW50SW5mb2AgdGhhdCB3aWxsIGJlIGRpc3BhdGNoZWRcbiAgICogYXMgc29vbiBhcyB0aGUgYERpc3BhdGNoZXJgIGlzIHJlZ2lzdGVyZWQuXG4gICAqL1xuICBwcml2YXRlIHF1ZXVlZEV2ZW50SW5mb3M6IGV2ZW50SW5mb0xpYi5FdmVudEluZm9bXSB8IG51bGwgPSBbXTtcblxuICAvKiogV2hldGhlciB0byBhZGQgYW4gYTExeSBjbGljayBsaXN0ZW5lci4gKi9cbiAgcHJpdmF0ZSBhZGRBMTF5Q2xpY2tMaXN0ZW5lciA9IGZhbHNlO1xuXG4gIGVjYWFjcz86IChcbiAgICB1cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgIHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgIHBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uOiB0eXBlb2YgYTExeUNsaWNrTGliLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICApID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgY29udGFpbmVyTWFuYWdlcjogRXZlbnRDb250cmFjdENvbnRhaW5lck1hbmFnZXIsXG4gICAgcHJpdmF0ZSByZWFkb25seSB1c2VBY3Rpb25SZXNvbHZlcjogZmFsc2UsXG4gICkge1xuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlciA9IGNvbnRhaW5lck1hbmFnZXI7XG4gICAgaWYgKHRoaXMudXNlQWN0aW9uUmVzb2x2ZXIpIHtcbiAgICAgIHRoaXMuYWN0aW9uUmVzb2x2ZXIgPSBuZXcgQWN0aW9uUmVzb2x2ZXIoe1xuICAgICAgICBzeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydDogRXZlbnRDb250cmFjdC5NT1VTRV9TUEVDSUFMX1NVUFBPUlQsXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKEV2ZW50Q29udHJhY3QuQTExWV9DTElDS19TVVBQT1JUKSB7XG4gICAgICAvLyBBZGQgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAgICB0aGlzLmFkZEExMXlDbGlja1N1cHBvcnQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZUV2ZW50KGV2ZW50VHlwZTogc3RyaW5nLCBldmVudDogRXZlbnQsIGNvbnRhaW5lcjogRWxlbWVudCkge1xuICAgIGNvbnN0IGV2ZW50SW5mbyA9IGV2ZW50SW5mb0xpYi5jcmVhdGVFdmVudEluZm9Gcm9tUGFyYW1ldGVycyhcbiAgICAgIC8qIGV2ZW50VHlwZT0gKi8gZXZlbnRUeXBlLFxuICAgICAgLyogZXZlbnQ9ICovIGV2ZW50LFxuICAgICAgLyogdGFyZ2V0RWxlbWVudD0gKi8gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQsXG4gICAgICAvKiBjb250YWluZXI9ICovIGNvbnRhaW5lcixcbiAgICAgIC8qIHRpbWVzdGFtcD0gKi8gRGF0ZS5ub3coKSxcbiAgICApO1xuICAgIHRoaXMuaGFuZGxlRXZlbnRJbmZvKGV2ZW50SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGFuIGBFdmVudEluZm9gLlxuICAgKi9cbiAgcHJpdmF0ZSBoYW5kbGVFdmVudEluZm8oZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgaWYgKCF0aGlzLmRpc3BhdGNoZXIpIHtcbiAgICAgIC8vIEFsbCBldmVudHMgYXJlIHF1ZXVlZCB3aGVuIHRoZSBkaXNwYXRjaGVyIGlzbid0IHlldCBsb2FkZWQuXG4gICAgICBldmVudEluZm9MaWIuc2V0SXNSZXBsYXkoZXZlbnRJbmZvLCB0cnVlKTtcbiAgICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcz8ucHVzaChldmVudEluZm8pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy51c2VBY3Rpb25SZXNvbHZlcikge1xuICAgICAgdGhpcy5hY3Rpb25SZXNvbHZlciEucmVzb2x2ZUV2ZW50VHlwZShldmVudEluZm8pO1xuICAgICAgdGhpcy5hY3Rpb25SZXNvbHZlciEucmVzb2x2ZUFjdGlvbihldmVudEluZm8pO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoZXIoZXZlbnRJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGpzYWN0aW9uIGhhbmRsZXJzIHRvIGJlIGNhbGxlZCBmb3IgdGhlIGV2ZW50IHR5cGUgZ2l2ZW4gYnlcbiAgICogbmFtZS5cbiAgICpcbiAgICogSWYgdGhlIGV2ZW50IGlzIGFscmVhZHkgcmVnaXN0ZXJlZCwgdGhpcyBkb2VzIG5vdGhpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBwcmVmaXhlZEV2ZW50VHlwZSBJZiBzdXBwbGllZCwgdGhpcyBldmVudCBpcyB1c2VkIGluXG4gICAqICAgICB0aGUgYWN0dWFsIGJyb3dzZXIgZXZlbnQgcmVnaXN0cmF0aW9uIGluc3RlYWQgb2YgdGhlIG5hbWUgdGhhdCBpc1xuICAgKiAgICAgZXhwb3NlZCB0byBqc2FjdGlvbi4gVXNlIHRoaXMgaWYgeW91IGUuZy4gd2FudCB1c2VycyB0byBiZSBhYmxlXG4gICAqICAgICB0byBzdWJzY3JpYmUgdG8ganNhY3Rpb249XCJ0cmFuc2l0aW9uRW5kOmZvb1wiIHdoaWxlIHRoZSB1bmRlcmx5aW5nXG4gICAqICAgICBldmVudCBpcyB3ZWJraXRUcmFuc2l0aW9uRW5kIGluIG9uZSBicm93c2VyIGFuZCBtb3pUcmFuc2l0aW9uRW5kXG4gICAqICAgICBpbiBhbm90aGVyLlxuICAgKi9cbiAgYWRkRXZlbnQoZXZlbnRUeXBlOiBzdHJpbmcsIHByZWZpeGVkRXZlbnRUeXBlPzogc3RyaW5nKSB7XG4gICAgaWYgKGV2ZW50VHlwZSBpbiB0aGlzLmV2ZW50SGFuZGxlcnMgfHwgIXRoaXMuY29udGFpbmVyTWFuYWdlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghRXZlbnRDb250cmFjdC5NT1VTRV9TUEVDSUFMX1NVUFBPUlQgJiYgTk9OX0JVQkJMSU5HX01PVVNFX0VWRU5UUy5pbmRleE9mKGV2ZW50VHlwZSkgPj0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGV2ZW50SGFuZGxlciA9IChldmVudFR5cGU6IHN0cmluZywgZXZlbnQ6IEV2ZW50LCBjb250YWluZXI6IEVsZW1lbnQpID0+IHtcbiAgICAgIHRoaXMuaGFuZGxlRXZlbnQoZXZlbnRUeXBlLCBldmVudCwgY29udGFpbmVyKTtcbiAgICB9O1xuXG4gICAgLy8gU3RvcmUgdGhlIGNhbGxiYWNrIHRvIGFsbG93IHVzIHRvIHJlcGxheSBldmVudHMuXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50VHlwZV0gPSBldmVudEhhbmRsZXI7XG5cbiAgICBjb25zdCBicm93c2VyRXZlbnRUeXBlID0gZXZlbnRMaWIuZ2V0QnJvd3NlckV2ZW50VHlwZShwcmVmaXhlZEV2ZW50VHlwZSB8fCBldmVudFR5cGUpO1xuXG4gICAgaWYgKGJyb3dzZXJFdmVudFR5cGUgIT09IGV2ZW50VHlwZSkge1xuICAgICAgY29uc3QgZXZlbnRUeXBlcyA9IHRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdIHx8IFtdO1xuICAgICAgZXZlbnRUeXBlcy5wdXNoKGV2ZW50VHlwZSk7XG4gICAgICB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlc1ticm93c2VyRXZlbnRUeXBlXSA9IGV2ZW50VHlwZXM7XG4gICAgfVxuXG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyLmFkZEV2ZW50TGlzdGVuZXIoYnJvd3NlckV2ZW50VHlwZSwgKGVsZW1lbnQ6IEVsZW1lbnQpID0+IHtcbiAgICAgIHJldHVybiAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50SGFuZGxlcihldmVudFR5cGUsIGV2ZW50LCBlbGVtZW50KTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvLyBBdXRvbWF0aWNhbGx5IGluc3RhbGwgYSBrZXlwcmVzcy9rZXlkb3duIGV2ZW50IGhhbmRsZXIgaWYgc3VwcG9ydCBmb3JcbiAgICAvLyBhY2Nlc3NpYmxlIGNsaWNrcyBpcyB0dXJuZWQgb24uXG4gICAgaWYgKHRoaXMuYWRkQTExeUNsaWNrTGlzdGVuZXIgJiYgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuQ0xJQ0spIHtcbiAgICAgIHRoaXMuYWRkRXZlbnQoRXZlbnRUeXBlLktFWURPV04pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBxdWV1ZWQgZWFybHkgZXZlbnRzIGFuZCByZXBsYXkgdGhlbSB1c2luZyB0aGUgYXBwcm9wcmlhdGUgaGFuZGxlclxuICAgKiBpbiB0aGUgcHJvdmlkZWQgZXZlbnQgY29udHJhY3QuIE9uY2UgYWxsIHRoZSBldmVudHMgYXJlIHJlcGxheWVkLCBpdCBjbGVhbnNcbiAgICogdXAgdGhlIGVhcmx5IGNvbnRyYWN0LlxuICAgKi9cbiAgcmVwbGF5RWFybHlFdmVudHMoXG4gICAgZWFybHlKc2FjdGlvbkNvbnRhaW5lcjogRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIgPSB3aW5kb3cgYXMgRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIsXG4gICkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBlYXJseSBjb250cmFjdCBpcyBwcmVzZW50IGFuZCBwcmV2ZW50IGNhbGxpbmcgdGhpcyBmdW5jdGlvblxuICAgIC8vIG1vcmUgdGhhbiBvbmNlLlxuICAgIGNvbnN0IGVhcmx5SnNhY3Rpb25EYXRhOiBFYXJseUpzYWN0aW9uRGF0YSB8IHVuZGVmaW5lZCA9IGVhcmx5SnNhY3Rpb25Db250YWluZXIuX2Vqc2E7XG4gICAgaWYgKCFlYXJseUpzYWN0aW9uRGF0YSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJlcGxheSB0aGUgZWFybHkgY29udHJhY3QgZXZlbnRzLlxuICAgIGNvbnN0IGVhcmx5RXZlbnRJbmZvczogZXZlbnRJbmZvTGliLkV2ZW50SW5mb1tdID0gZWFybHlKc2FjdGlvbkRhdGEucTtcbiAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBlYXJseUV2ZW50SW5mb3MubGVuZ3RoOyBpZHgrKykge1xuICAgICAgY29uc3QgZWFybHlFdmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8gPSBlYXJseUV2ZW50SW5mb3NbaWR4XTtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZXMgPSB0aGlzLmdldEV2ZW50VHlwZXNGb3JCcm93c2VyRXZlbnRUeXBlKGVhcmx5RXZlbnRJbmZvLmV2ZW50VHlwZSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50VHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZXZlbnRJbmZvID0gZXZlbnRJbmZvTGliLmNsb25lRXZlbnRJbmZvKGVhcmx5RXZlbnRJbmZvKTtcbiAgICAgICAgLy8gRXZlbnRJbmZvIGV2ZW50VHlwZSBtYXBzIHRvIEpTQWN0aW9uJ3MgaW50ZXJuYWwgZXZlbnQgdHlwZSxcbiAgICAgICAgLy8gcmF0aGVyIHRoYW4gdGhlIGJyb3dzZXIgZXZlbnQgdHlwZS5cbiAgICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50VHlwZShldmVudEluZm8sIGV2ZW50VHlwZXNbaV0pO1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50SW5mbyhldmVudEluZm8pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENsZWFuIHVwIHRoZSBlYXJseSBjb250cmFjdC5cbiAgICBjb25zdCBlYXJseUV2ZW50SGFuZGxlcjogKGV2ZW50OiBFdmVudCkgPT4gdm9pZCA9IGVhcmx5SnNhY3Rpb25EYXRhLmg7XG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZWFybHlKc2FjdGlvbkRhdGEuYywgZWFybHlKc2FjdGlvbkRhdGEuZXQsIGVhcmx5RXZlbnRIYW5kbGVyKTtcbiAgICByZW1vdmVFdmVudExpc3RlbmVycyhlYXJseUpzYWN0aW9uRGF0YS5jLCBlYXJseUpzYWN0aW9uRGF0YS5ldGMsIGVhcmx5RXZlbnRIYW5kbGVyLCB0cnVlKTtcbiAgICBkZWxldGUgZWFybHlKc2FjdGlvbkNvbnRhaW5lci5fZWpzYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFsbCBKU0FjdGlvbiBldmVudCB0eXBlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciBhIGdpdmVuXG4gICAqIGJyb3dzZXIgZXZlbnQgdHlwZS5cbiAgICovXG4gIHByaXZhdGUgZ2V0RXZlbnRUeXBlc0ZvckJyb3dzZXJFdmVudFR5cGUoYnJvd3NlckV2ZW50VHlwZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZXZlbnRUeXBlcyA9IFtdO1xuICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnNbYnJvd3NlckV2ZW50VHlwZV0pIHtcbiAgICAgIGV2ZW50VHlwZXMucHVzaChicm93c2VyRXZlbnRUeXBlKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdKSB7XG4gICAgICBldmVudFR5cGVzLnB1c2goLi4udGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXNbYnJvd3NlckV2ZW50VHlwZV0pO1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnRUeXBlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uIGZvciBhIGdpdmVuIGV2ZW50IHR5cGUuXG4gICAqL1xuICBoYW5kbGVyKGV2ZW50VHlwZTogc3RyaW5nKTogRXZlbnRIYW5kbGVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50VHlwZV07XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHRoZSBldmVudCBjb250cmFjdC4gVGhpcyByZXNldHMgYWxsIG9mIHRoZSBgRXZlbnRDb250cmFjdGAnc1xuICAgKiBpbnRlcm5hbCBzdGF0ZS4gVXNlcnMgYXJlIHJlc3BvbnNpYmxlIGZvciBub3QgdXNpbmcgdGhpcyBgRXZlbnRDb250cmFjdGBcbiAgICogYWZ0ZXIgaXQgaGFzIGJlZW4gY2xlYW5lZCB1cC5cbiAgICovXG4gIGNsZWFuVXAoKSB7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyIS5jbGVhblVwKCk7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyID0gbnVsbDtcbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlcyA9IHt9O1xuICAgIHRoaXMuZGlzcGF0Y2hlciA9IG51bGw7XG4gICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zID0gW107XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBkaXNwYXRjaGVyIGZ1bmN0aW9uLiBFdmVudCBpbmZvIG9mIGVhY2ggZXZlbnQgbWFwcGVkIHRvXG4gICAqIGEganNhY3Rpb24gaXMgcGFzc2VkIGZvciBoYW5kbGluZyB0byB0aGlzIGNhbGxiYWNrLiBUaGUgcXVldWVkXG4gICAqIGV2ZW50cyBhcmUgcGFzc2VkIGFzIHdlbGwgdG8gdGhlIGRpc3BhdGNoZXIgZm9yIGxhdGVyIHJlcGxheWluZ1xuICAgKiBvbmNlIHRoZSBkaXNwYXRjaGVyIGlzIHJlZ2lzdGVyZWQuIENsZWFycyB0aGUgZXZlbnQgcXVldWUgdG8gbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIGRpc3BhdGNoZXIgVGhlIGRpc3BhdGNoZXIgZnVuY3Rpb24uXG4gICAqIEBwYXJhbSByZXN0cmljdGlvblxuICAgKi9cbiAgcmVnaXN0ZXJEaXNwYXRjaGVyKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIsIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbikge1xuICAgIHRoaXMuZWNyZChkaXNwYXRjaGVyLCByZXN0cmljdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVW5yZW5hbWVkIGFsaWFzIGZvciByZWdpc3RlckRpc3BhdGNoZXIuIE5lY2Vzc2FyeSBmb3IgYW55IGNvZGViYXNlcyB0aGF0XG4gICAqIHNwbGl0IHRoZSBgRXZlbnRDb250cmFjdGAgYW5kIGBEaXNwYXRjaGVyYCBjb2RlIGludG8gZGlmZmVyZW50IGNvbXBpbGF0aW9uXG4gICAqIHVuaXRzLlxuICAgKi9cbiAgZWNyZChkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLCByZXN0cmljdGlvbjogUmVzdHJpY3Rpb24pIHtcbiAgICB0aGlzLmRpc3BhdGNoZXIgPSBkaXNwYXRjaGVyO1xuXG4gICAgaWYgKHRoaXMucXVldWVkRXZlbnRJbmZvcz8ubGVuZ3RoKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVldWVkRXZlbnRJbmZvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50SW5mbyh0aGlzLnF1ZXVlZEV2ZW50SW5mb3NbaV0pO1xuICAgICAgfVxuICAgICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gdGhlIGdpdmVuIGBFdmVudENvbnRyYWN0YC4gTWVhbnQgdG8gYmUgY2FsbGVkIGluXG4gICAqIHRoZSBzYW1lIGNvbXBpbGF0aW9uIHVuaXQgYXMgdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICovXG4gIGFkZEExMXlDbGlja1N1cHBvcnQoKSB7XG4gICAgdGhpcy5hZGRBMTF5Q2xpY2tTdXBwb3J0SW1wbChcbiAgICAgIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgICBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgICBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGExMXkgY2xpY2sgc3VwcG9ydCB0byBiZSBkZWZlcnJlZC4gTWVhbnQgdG8gYmUgY2FsbGVkIGluIHRoZSBzYW1lXG4gICAqIGNvbXBpbGF0aW9uIHVuaXQgYXMgdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICovXG4gIGV4cG9ydEFkZEExMXlDbGlja1N1cHBvcnQoKSB7XG4gICAgdGhpcy5hZGRBMTF5Q2xpY2tMaXN0ZW5lciA9IHRydWU7XG4gICAgdGhpcy5lY2FhY3MgPSB0aGlzLmFkZEExMXlDbGlja1N1cHBvcnRJbXBsLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogVW5yZW5hbWVkIGZ1bmN0aW9uIHRoYXQgbG9hZHMgYTExeUNsaWNrU3VwcG9ydC5cbiAgICovXG4gIHByaXZhdGUgYWRkQTExeUNsaWNrU3VwcG9ydEltcGwoXG4gICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayxcbiAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjogdHlwZW9mIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKSB7XG4gICAgdGhpcy5hZGRBMTF5Q2xpY2tMaXN0ZW5lciA9IHRydWU7XG4gICAgaWYgKHRoaXMudXNlQWN0aW9uUmVzb2x2ZXIpIHtcbiAgICAgIHRoaXMuYWN0aW9uUmVzb2x2ZXIhLmFkZEExMXlDbGlja1N1cHBvcnQoXG4gICAgICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICAgICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgICAgIHBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoXG4gIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gIGV2ZW50VHlwZXM6IHN0cmluZ1tdLFxuICBlYXJseUV2ZW50SGFuZGxlcjogKGU6IEV2ZW50KSA9PiB2b2lkLFxuICBjYXB0dXJlPzogYm9vbGVhbixcbikge1xuICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBldmVudFR5cGVzLmxlbmd0aDsgaWR4KyspIHtcbiAgICBjb250YWluZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGVzW2lkeF0sIGVhcmx5RXZlbnRIYW5kbGVyLCAvKiB1c2VDYXB0dXJlICovIGNhcHR1cmUpO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gdGhlIGdpdmVuIGBFdmVudENvbnRyYWN0YC4gTWVhbnQgdG8gYmUgY2FsbGVkXG4gKiBpbiBhIGRpZmZlcmVudCBjb21waWxhdGlvbiB1bml0IGZyb20gdGhlIGBFdmVudENvbnRyYWN0YC4gVGhlIGBFdmVudENvbnRyYWN0YFxuICogbXVzdCBoYXZlIGNhbGxlZCBgZXhwb3J0QWRkQTExeUNsaWNrU3VwcG9ydGAgaW4gaXRzIGNvbXBpbGF0aW9uIHVuaXQgZm9yIHRoaXNcbiAqIHRvIGhhdmUgYW55IGVmZmVjdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZERlZmVycmVkQTExeUNsaWNrU3VwcG9ydChldmVudENvbnRyYWN0OiBFdmVudENvbnRyYWN0KSB7XG4gIGV2ZW50Q29udHJhY3QuZWNhYWNzPy4oXG4gICAgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgYTExeUNsaWNrTGliLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICApO1xufVxuIl19