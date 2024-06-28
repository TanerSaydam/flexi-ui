/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectionScheduler, } from '../change_detection/scheduling/zoneless_scheduling';
import { assertInInjectionContext, Injector, runInInjectionContext, ɵɵdefineInjectable } from '../di';
import { inject } from '../di/injector_compatibility';
import { ErrorHandler } from '../error_handler';
import { DestroyRef } from '../linker/destroy_ref';
import { assertNotInReactiveContext } from '../render3/reactivity/asserts';
import { performanceMarkFeature } from '../util/performance';
import { NgZone } from '../zone/ng_zone';
import { isPlatformBrowser } from './util/misc_utils';
/**
 * The phase to run an `afterRender` or `afterNextRender` callback in.
 *
 * Callbacks in the same phase run in the order they are registered. Phases run in the
 * following order after each render:
 *
 *   1. `AfterRenderPhase.EarlyRead`
 *   2. `AfterRenderPhase.Write`
 *   3. `AfterRenderPhase.MixedReadWrite`
 *   4. `AfterRenderPhase.Read`
 *
 * Angular is unable to verify or enforce that phases are used correctly, and instead
 * relies on each developer to follow the guidelines documented for each value and
 * carefully choose the appropriate one, refactoring their code if necessary. By doing
 * so, Angular is better able to minimize the performance degradation associated with
 * manual DOM access, ensuring the best experience for the end users of your application
 * or library.
 *
 * @developerPreview
 */
export var AfterRenderPhase;
(function (AfterRenderPhase) {
    /**
     * Use `AfterRenderPhase.EarlyRead` for callbacks that only need to **read** from the
     * DOM before a subsequent `AfterRenderPhase.Write` callback, for example to perform
     * custom layout that the browser doesn't natively support. **Never** use this phase
     * for callbacks that can write to the DOM or when `AfterRenderPhase.Read` is adequate.
     *
     * <div class="alert is-important">
     *
     * Using this value can degrade performance.
     * Instead, prefer using built-in browser functionality when possible.
     *
     * </div>
     */
    AfterRenderPhase[AfterRenderPhase["EarlyRead"] = 0] = "EarlyRead";
    /**
     * Use `AfterRenderPhase.Write` for callbacks that only **write** to the DOM. **Never**
     * use this phase for callbacks that can read from the DOM.
     */
    AfterRenderPhase[AfterRenderPhase["Write"] = 1] = "Write";
    /**
     * Use `AfterRenderPhase.MixedReadWrite` for callbacks that read from or write to the
     * DOM, that haven't been refactored to use a different phase. **Never** use this phase
     * for callbacks that can use a different phase instead.
     *
     * <div class="alert is-critical">
     *
     * Using this value can **significantly** degrade performance.
     * Instead, prefer refactoring into multiple callbacks using a more specific phase.
     *
     * </div>
     */
    AfterRenderPhase[AfterRenderPhase["MixedReadWrite"] = 2] = "MixedReadWrite";
    /**
     * Use `AfterRenderPhase.Read` for callbacks that only **read** from the DOM. **Never**
     * use this phase for callbacks that can write to the DOM.
     */
    AfterRenderPhase[AfterRenderPhase["Read"] = 3] = "Read";
})(AfterRenderPhase || (AfterRenderPhase = {}));
/** `AfterRenderRef` that does nothing. */
const NOOP_AFTER_RENDER_REF = {
    destroy() { },
};
/**
 * Register a callback to run once before any userspace `afterRender` or
 * `afterNextRender` callbacks.
 *
 * This function should almost always be used instead of `afterRender` or
 * `afterNextRender` for implementing framework functionality. Consider:
 *
 *   1.) `AfterRenderPhase.EarlyRead` is intended to be used for implementing
 *       custom layout. If the framework itself mutates the DOM after *any*
 *       `AfterRenderPhase.EarlyRead` callbacks are run, the phase can no
 *       longer reliably serve its purpose.
 *
 *   2.) Importing `afterRender` in the framework can reduce the ability for it
 *       to be tree-shaken, and the framework shouldn't need much of the behavior.
 */
export function internalAfterNextRender(callback, options) {
    const injector = options?.injector ?? inject(Injector);
    // Similarly to the public `afterNextRender` function, an internal one
    // is only invoked in a browser as long as the runOnServer option is not set.
    if (!options?.runOnServer && !isPlatformBrowser(injector))
        return;
    const afterRenderEventManager = injector.get(AfterRenderEventManager);
    afterRenderEventManager.internalCallbacks.push(callback);
}
/**
 * Register a callback to be invoked each time the application
 * finishes rendering.
 *
 * <div class="alert is-critical">
 *
 * You should always explicitly specify a non-default [phase](api/core/AfterRenderPhase), or you
 * risk significant performance degradation.
 *
 * </div>
 *
 * Note that the callback will run
 * - in the order it was registered
 * - once per render
 * - on browser platforms only
 *
 * <div class="alert is-important">
 *
 * Components are not guaranteed to be [hydrated](guide/hydration) before the callback runs.
 * You must use caution when directly reading or writing the DOM and layout.
 *
 * </div>
 *
 * @param callback A callback function to register
 * @param options Options to control the behavior of the callback
 *
 * @usageNotes
 *
 * Use `afterRender` to read or write the DOM after each render.
 *
 * ### Example
 * ```ts
 * @Component({
 *   selector: 'my-cmp',
 *   template: `<span #content>{{ ... }}</span>`,
 * })
 * export class MyComponent {
 *   @ViewChild('content') contentRef: ElementRef;
 *
 *   constructor() {
 *     afterRender(() => {
 *       console.log('content height: ' + this.contentRef.nativeElement.scrollHeight);
 *     }, {phase: AfterRenderPhase.Read});
 *   }
 * }
 * ```
 *
 * @developerPreview
 */
export function afterRender(callback, options) {
    ngDevMode &&
        assertNotInReactiveContext(afterRender, 'Call `afterRender` outside of a reactive context. For example, schedule the render ' +
            'callback inside the component constructor`.');
    !options && assertInInjectionContext(afterRender);
    const injector = options?.injector ?? inject(Injector);
    if (!isPlatformBrowser(injector)) {
        return NOOP_AFTER_RENDER_REF;
    }
    performanceMarkFeature('NgAfterRender');
    const afterRenderEventManager = injector.get(AfterRenderEventManager);
    // Lazily initialize the handler implementation, if necessary. This is so that it can be
    // tree-shaken if `afterRender` and `afterNextRender` aren't used.
    const callbackHandler = (afterRenderEventManager.handler ??=
        new AfterRenderCallbackHandlerImpl());
    const phase = options?.phase ?? AfterRenderPhase.MixedReadWrite;
    const destroy = () => {
        callbackHandler.unregister(instance);
        unregisterFn();
    };
    const unregisterFn = injector.get(DestroyRef).onDestroy(destroy);
    const instance = runInInjectionContext(injector, () => new AfterRenderCallback(phase, callback));
    callbackHandler.register(instance);
    return { destroy };
}
/**
 * Register a callback to be invoked the next time the application
 * finishes rendering.
 *
 * <div class="alert is-critical">
 *
 * You should always explicitly specify a non-default [phase](api/core/AfterRenderPhase), or you
 * risk significant performance degradation.
 *
 * </div>
 *
 * Note that the callback will run
 * - in the order it was registered
 * - on browser platforms only
 *
 * <div class="alert is-important">
 *
 * Components are not guaranteed to be [hydrated](guide/hydration) before the callback runs.
 * You must use caution when directly reading or writing the DOM and layout.
 *
 * </div>
 *
 * @param callback A callback function to register
 * @param options Options to control the behavior of the callback
 *
 * @usageNotes
 *
 * Use `afterNextRender` to read or write the DOM once,
 * for example to initialize a non-Angular library.
 *
 * ### Example
 * ```ts
 * @Component({
 *   selector: 'my-chart-cmp',
 *   template: `<div #chart>{{ ... }}</div>`,
 * })
 * export class MyChartCmp {
 *   @ViewChild('chart') chartRef: ElementRef;
 *   chart: MyChart|null;
 *
 *   constructor() {
 *     afterNextRender(() => {
 *       this.chart = new MyChart(this.chartRef.nativeElement);
 *     }, {phase: AfterRenderPhase.Write});
 *   }
 * }
 * ```
 *
 * @developerPreview
 */
export function afterNextRender(callback, options) {
    !options && assertInInjectionContext(afterNextRender);
    const injector = options?.injector ?? inject(Injector);
    if (!isPlatformBrowser(injector)) {
        return NOOP_AFTER_RENDER_REF;
    }
    performanceMarkFeature('NgAfterNextRender');
    const afterRenderEventManager = injector.get(AfterRenderEventManager);
    // Lazily initialize the handler implementation, if necessary. This is so that it can be
    // tree-shaken if `afterRender` and `afterNextRender` aren't used.
    const callbackHandler = (afterRenderEventManager.handler ??=
        new AfterRenderCallbackHandlerImpl());
    const phase = options?.phase ?? AfterRenderPhase.MixedReadWrite;
    const destroy = () => {
        callbackHandler.unregister(instance);
        unregisterFn();
    };
    const unregisterFn = injector.get(DestroyRef).onDestroy(destroy);
    const instance = runInInjectionContext(injector, () => new AfterRenderCallback(phase, () => {
        destroy();
        callback();
    }));
    callbackHandler.register(instance);
    return { destroy };
}
/**
 * A wrapper around a function to be used as an after render callback.
 */
class AfterRenderCallback {
    constructor(phase, callbackFn) {
        this.phase = phase;
        this.callbackFn = callbackFn;
        this.zone = inject(NgZone);
        this.errorHandler = inject(ErrorHandler, { optional: true });
        // Registering a callback will notify the scheduler.
        inject(ChangeDetectionScheduler, { optional: true })?.notify(6 /* NotificationSource.NewRenderHook */);
    }
    invoke() {
        try {
            this.zone.runOutsideAngular(this.callbackFn);
        }
        catch (err) {
            this.errorHandler?.handleError(err);
        }
    }
}
/**
 * Core functionality for `afterRender` and `afterNextRender`. Kept separate from
 * `AfterRenderEventManager` for tree-shaking.
 */
class AfterRenderCallbackHandlerImpl {
    constructor() {
        this.executingCallbacks = false;
        this.buckets = {
            // Note: the order of these keys controls the order the phases are run.
            [AfterRenderPhase.EarlyRead]: new Set(),
            [AfterRenderPhase.Write]: new Set(),
            [AfterRenderPhase.MixedReadWrite]: new Set(),
            [AfterRenderPhase.Read]: new Set(),
        };
        this.deferredCallbacks = new Set();
    }
    register(callback) {
        // If we're currently running callbacks, new callbacks should be deferred
        // until the next render operation.
        const target = this.executingCallbacks ? this.deferredCallbacks : this.buckets[callback.phase];
        target.add(callback);
    }
    unregister(callback) {
        this.buckets[callback.phase].delete(callback);
        this.deferredCallbacks.delete(callback);
    }
    execute() {
        this.executingCallbacks = true;
        for (const bucket of Object.values(this.buckets)) {
            for (const callback of bucket) {
                callback.invoke();
            }
        }
        this.executingCallbacks = false;
        for (const callback of this.deferredCallbacks) {
            this.buckets[callback.phase].add(callback);
        }
        this.deferredCallbacks.clear();
    }
    destroy() {
        for (const bucket of Object.values(this.buckets)) {
            bucket.clear();
        }
        this.deferredCallbacks.clear();
    }
}
/**
 * Implements core timing for `afterRender` and `afterNextRender` events.
 * Delegates to an optional `AfterRenderCallbackHandler` for implementation.
 */
export class AfterRenderEventManager {
    constructor() {
        /* @internal */
        this.handler = null;
        /* @internal */
        this.internalCallbacks = [];
    }
    /**
     * Executes internal and user-provided callbacks.
     */
    execute() {
        this.executeInternalCallbacks();
        this.handler?.execute();
    }
    executeInternalCallbacks() {
        // Note: internal callbacks power `internalAfterNextRender`. Since internal callbacks
        // are fairly trivial, they are kept separate so that `AfterRenderCallbackHandlerImpl`
        // can still be tree-shaken unless used by the application.
        const callbacks = [...this.internalCallbacks];
        this.internalCallbacks.length = 0;
        for (const callback of callbacks) {
            callback();
        }
    }
    ngOnDestroy() {
        this.handler?.destroy();
        this.handler = null;
        this.internalCallbacks.length = 0;
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: AfterRenderEventManager,
        providedIn: 'root',
        factory: () => new AfterRenderEventManager(),
    }); }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLHdCQUF3QixHQUV6QixNQUFNLG9EQUFvRCxDQUFDO0FBQzVELE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxRQUFRLEVBQUUscUJBQXFCLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDcEcsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDakQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDekUsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDM0QsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRXZDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXBEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxDQUFOLElBQVksZ0JBeUNYO0FBekNELFdBQVksZ0JBQWdCO0lBQzFCOzs7Ozs7Ozs7Ozs7T0FZRztJQUNILGlFQUFTLENBQUE7SUFFVDs7O09BR0c7SUFDSCx5REFBSyxDQUFBO0lBRUw7Ozs7Ozs7Ozs7O09BV0c7SUFDSCwyRUFBYyxDQUFBO0lBRWQ7OztPQUdHO0lBQ0gsdURBQUksQ0FBQTtBQUNOLENBQUMsRUF6Q1csZ0JBQWdCLEtBQWhCLGdCQUFnQixRQXlDM0I7QUEwREQsMENBQTBDO0FBQzFDLE1BQU0scUJBQXFCLEdBQW1CO0lBQzVDLE9BQU8sS0FBSSxDQUFDO0NBQ2IsQ0FBQztBQUVGOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBQ0gsTUFBTSxVQUFVLHVCQUF1QixDQUNyQyxRQUFzQixFQUN0QixPQUF3QztJQUV4QyxNQUFNLFFBQVEsR0FBRyxPQUFPLEVBQUUsUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV2RCxzRUFBc0U7SUFDdEUsNkVBQTZFO0lBQzdFLElBQUksQ0FBQyxPQUFPLEVBQUUsV0FBVyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDO1FBQUUsT0FBTztJQUVsRSxNQUFNLHVCQUF1QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUN0RSx1QkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnREc7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUFDLFFBQXNCLEVBQUUsT0FBNEI7SUFDOUUsU0FBUztRQUNQLDBCQUEwQixDQUN4QixXQUFXLEVBQ1gscUZBQXFGO1lBQ25GLDZDQUE2QyxDQUNoRCxDQUFDO0lBRUosQ0FBQyxPQUFPLElBQUksd0JBQXdCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDbEQsTUFBTSxRQUFRLEdBQUcsT0FBTyxFQUFFLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFdkQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDakMsT0FBTyxxQkFBcUIsQ0FBQztJQUMvQixDQUFDO0lBRUQsc0JBQXNCLENBQUMsZUFBZSxDQUFDLENBQUM7SUFFeEMsTUFBTSx1QkFBdUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7SUFDdEUsd0ZBQXdGO0lBQ3hGLGtFQUFrRTtJQUNsRSxNQUFNLGVBQWUsR0FBRyxDQUFDLHVCQUF1QixDQUFDLE9BQU87UUFDdEQsSUFBSSw4QkFBOEIsRUFBRSxDQUFDLENBQUM7SUFDeEMsTUFBTSxLQUFLLEdBQUcsT0FBTyxFQUFFLEtBQUssSUFBSSxnQkFBZ0IsQ0FBQyxjQUFjLENBQUM7SUFDaEUsTUFBTSxPQUFPLEdBQUcsR0FBRyxFQUFFO1FBQ25CLGVBQWUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsWUFBWSxFQUFFLENBQUM7SUFDakIsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDakUsTUFBTSxRQUFRLEdBQUcscUJBQXFCLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksbUJBQW1CLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFFakcsZUFBZSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuQyxPQUFPLEVBQUMsT0FBTyxFQUFDLENBQUM7QUFDbkIsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaURHO0FBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FDN0IsUUFBc0IsRUFDdEIsT0FBNEI7SUFFNUIsQ0FBQyxPQUFPLElBQUksd0JBQXdCLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDdEQsTUFBTSxRQUFRLEdBQUcsT0FBTyxFQUFFLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFdkQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDakMsT0FBTyxxQkFBcUIsQ0FBQztJQUMvQixDQUFDO0lBRUQsc0JBQXNCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUU1QyxNQUFNLHVCQUF1QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUN0RSx3RkFBd0Y7SUFDeEYsa0VBQWtFO0lBQ2xFLE1BQU0sZUFBZSxHQUFHLENBQUMsdUJBQXVCLENBQUMsT0FBTztRQUN0RCxJQUFJLDhCQUE4QixFQUFFLENBQUMsQ0FBQztJQUN4QyxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQUUsS0FBSyxJQUFJLGdCQUFnQixDQUFDLGNBQWMsQ0FBQztJQUNoRSxNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUU7UUFDbkIsZUFBZSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQyxZQUFZLEVBQUUsQ0FBQztJQUNqQixDQUFDLENBQUM7SUFDRixNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqRSxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FDcEMsUUFBUSxFQUNSLEdBQUcsRUFBRSxDQUNILElBQUksbUJBQW1CLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtRQUNsQyxPQUFPLEVBQUUsQ0FBQztRQUNWLFFBQVEsRUFBRSxDQUFDO0lBQ2IsQ0FBQyxDQUFDLENBQ0wsQ0FBQztJQUVGLGVBQWUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsT0FBTyxFQUFDLE9BQU8sRUFBQyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sbUJBQW1CO0lBSXZCLFlBQ1csS0FBdUIsRUFDeEIsVUFBd0I7UUFEdkIsVUFBSyxHQUFMLEtBQUssQ0FBa0I7UUFDeEIsZUFBVSxHQUFWLFVBQVUsQ0FBYztRQUwxQixTQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RCLGlCQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1FBTTVELG9EQUFvRDtRQUNwRCxNQUFNLENBQUMsd0JBQXdCLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsRUFBRSxNQUFNLDBDQUFrQyxDQUFDO0lBQy9GLENBQUM7SUFFRCxNQUFNO1FBQ0osSUFBSSxDQUFDO1lBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixJQUFJLENBQUMsWUFBWSxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN0QyxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBMkJEOzs7R0FHRztBQUNILE1BQU0sOEJBQThCO0lBQXBDO1FBQ1UsdUJBQWtCLEdBQUcsS0FBSyxDQUFDO1FBQzNCLFlBQU8sR0FBRztZQUNoQix1RUFBdUU7WUFDdkUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBdUI7WUFDNUQsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBdUI7WUFDeEQsQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBdUI7WUFDakUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBdUI7U0FDeEQsQ0FBQztRQUNNLHNCQUFpQixHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO0lBbUM3RCxDQUFDO0lBakNDLFFBQVEsQ0FBQyxRQUE2QjtRQUNwQyx5RUFBeUU7UUFDekUsbUNBQW1DO1FBQ25DLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvRixNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxVQUFVLENBQUMsUUFBNkI7UUFDdEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELE9BQU87UUFDTCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1FBQy9CLEtBQUssTUFBTSxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNqRCxLQUFLLE1BQU0sUUFBUSxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUM5QixRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDcEIsQ0FBQztRQUNILENBQUM7UUFDRCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsS0FBSyxDQUFDO1FBRWhDLEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDOUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDakMsQ0FBQztJQUVELE9BQU87UUFDTCxLQUFLLE1BQU0sTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDakQsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDakMsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLHVCQUF1QjtJQUFwQztRQUNFLGVBQWU7UUFDZixZQUFPLEdBQXNDLElBQUksQ0FBQztRQUVsRCxlQUFlO1FBQ2Ysc0JBQWlCLEdBQW1CLEVBQUUsQ0FBQztJQWlDekMsQ0FBQztJQS9CQzs7T0FFRztJQUNILE9BQU87UUFDTCxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFFRCx3QkFBd0I7UUFDdEIscUZBQXFGO1FBQ3JGLHNGQUFzRjtRQUN0RiwyREFBMkQ7UUFDM0QsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFLENBQUM7WUFDakMsUUFBUSxFQUFFLENBQUM7UUFDYixDQUFDO0lBQ0gsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxrQkFBa0I7YUFDWCxVQUFLLEdBQTZCLGtCQUFrQixDQUFDO1FBQzFELEtBQUssRUFBRSx1QkFBdUI7UUFDOUIsVUFBVSxFQUFFLE1BQU07UUFDbEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksdUJBQXVCLEVBQUU7S0FDN0MsQ0FBQyxBQUpVLENBSVQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLFxuICBOb3RpZmljYXRpb25Tb3VyY2UsXG59IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vc2NoZWR1bGluZy96b25lbGVzc19zY2hlZHVsaW5nJztcbmltcG9ydCB7YXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0LCBJbmplY3RvciwgcnVuSW5JbmplY3Rpb25Db250ZXh0LCDJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtEZXN0cm95UmVmfSBmcm9tICcuLi9saW5rZXIvZGVzdHJveV9yZWYnO1xuaW1wb3J0IHthc3NlcnROb3RJblJlYWN0aXZlQ29udGV4dH0gZnJvbSAnLi4vcmVuZGVyMy9yZWFjdGl2aXR5L2Fzc2VydHMnO1xuaW1wb3J0IHtwZXJmb3JtYW5jZU1hcmtGZWF0dXJlfSBmcm9tICcuLi91dGlsL3BlcmZvcm1hbmNlJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lL25nX3pvbmUnO1xuXG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5cbi8qKlxuICogVGhlIHBoYXNlIHRvIHJ1biBhbiBgYWZ0ZXJSZW5kZXJgIG9yIGBhZnRlck5leHRSZW5kZXJgIGNhbGxiYWNrIGluLlxuICpcbiAqIENhbGxiYWNrcyBpbiB0aGUgc2FtZSBwaGFzZSBydW4gaW4gdGhlIG9yZGVyIHRoZXkgYXJlIHJlZ2lzdGVyZWQuIFBoYXNlcyBydW4gaW4gdGhlXG4gKiBmb2xsb3dpbmcgb3JkZXIgYWZ0ZXIgZWFjaCByZW5kZXI6XG4gKlxuICogICAxLiBgQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRgXG4gKiAgIDIuIGBBZnRlclJlbmRlclBoYXNlLldyaXRlYFxuICogICAzLiBgQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZWBcbiAqICAgNC4gYEFmdGVyUmVuZGVyUGhhc2UuUmVhZGBcbiAqXG4gKiBBbmd1bGFyIGlzIHVuYWJsZSB0byB2ZXJpZnkgb3IgZW5mb3JjZSB0aGF0IHBoYXNlcyBhcmUgdXNlZCBjb3JyZWN0bHksIGFuZCBpbnN0ZWFkXG4gKiByZWxpZXMgb24gZWFjaCBkZXZlbG9wZXIgdG8gZm9sbG93IHRoZSBndWlkZWxpbmVzIGRvY3VtZW50ZWQgZm9yIGVhY2ggdmFsdWUgYW5kXG4gKiBjYXJlZnVsbHkgY2hvb3NlIHRoZSBhcHByb3ByaWF0ZSBvbmUsIHJlZmFjdG9yaW5nIHRoZWlyIGNvZGUgaWYgbmVjZXNzYXJ5LiBCeSBkb2luZ1xuICogc28sIEFuZ3VsYXIgaXMgYmV0dGVyIGFibGUgdG8gbWluaW1pemUgdGhlIHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uIGFzc29jaWF0ZWQgd2l0aFxuICogbWFudWFsIERPTSBhY2Nlc3MsIGVuc3VyaW5nIHRoZSBiZXN0IGV4cGVyaWVuY2UgZm9yIHRoZSBlbmQgdXNlcnMgb2YgeW91ciBhcHBsaWNhdGlvblxuICogb3IgbGlicmFyeS5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZW51bSBBZnRlclJlbmRlclBoYXNlIHtcbiAgLyoqXG4gICAqIFVzZSBgQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5IG5lZWQgdG8gKipyZWFkKiogZnJvbSB0aGVcbiAgICogRE9NIGJlZm9yZSBhIHN1YnNlcXVlbnQgYEFmdGVyUmVuZGVyUGhhc2UuV3JpdGVgIGNhbGxiYWNrLCBmb3IgZXhhbXBsZSB0byBwZXJmb3JtXG4gICAqIGN1c3RvbSBsYXlvdXQgdGhhdCB0aGUgYnJvd3NlciBkb2Vzbid0IG5hdGl2ZWx5IHN1cHBvcnQuICoqTmV2ZXIqKiB1c2UgdGhpcyBwaGFzZVxuICAgKiBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHdyaXRlIHRvIHRoZSBET00gb3Igd2hlbiBgQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkYCBpcyBhZGVxdWF0ZS5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICAgKlxuICAgKiBVc2luZyB0aGlzIHZhbHVlIGNhbiBkZWdyYWRlIHBlcmZvcm1hbmNlLlxuICAgKiBJbnN0ZWFkLCBwcmVmZXIgdXNpbmcgYnVpbHQtaW4gYnJvd3NlciBmdW5jdGlvbmFsaXR5IHdoZW4gcG9zc2libGUuXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgRWFybHlSZWFkLFxuXG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuV3JpdGVgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5ICoqd3JpdGUqKiB0byB0aGUgRE9NLiAqKk5ldmVyKipcbiAgICogdXNlIHRoaXMgcGhhc2UgZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiByZWFkIGZyb20gdGhlIERPTS5cbiAgICovXG4gIFdyaXRlLFxuXG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVgIGZvciBjYWxsYmFja3MgdGhhdCByZWFkIGZyb20gb3Igd3JpdGUgdG8gdGhlXG4gICAqIERPTSwgdGhhdCBoYXZlbid0IGJlZW4gcmVmYWN0b3JlZCB0byB1c2UgYSBkaWZmZXJlbnQgcGhhc2UuICoqTmV2ZXIqKiB1c2UgdGhpcyBwaGFzZVxuICAgKiBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHVzZSBhIGRpZmZlcmVudCBwaGFzZSBpbnN0ZWFkLlxuICAgKlxuICAgKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAgICpcbiAgICogVXNpbmcgdGhpcyB2YWx1ZSBjYW4gKipzaWduaWZpY2FudGx5KiogZGVncmFkZSBwZXJmb3JtYW5jZS5cbiAgICogSW5zdGVhZCwgcHJlZmVyIHJlZmFjdG9yaW5nIGludG8gbXVsdGlwbGUgY2FsbGJhY2tzIHVzaW5nIGEgbW9yZSBzcGVjaWZpYyBwaGFzZS5cbiAgICpcbiAgICogPC9kaXY+XG4gICAqL1xuICBNaXhlZFJlYWRXcml0ZSxcblxuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLlJlYWRgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5ICoqcmVhZCoqIGZyb20gdGhlIERPTS4gKipOZXZlcioqXG4gICAqIHVzZSB0aGlzIHBoYXNlIGZvciBjYWxsYmFja3MgdGhhdCBjYW4gd3JpdGUgdG8gdGhlIERPTS5cbiAgICovXG4gIFJlYWQsXG59XG5cbi8qKlxuICogT3B0aW9ucyBwYXNzZWQgdG8gYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZnRlclJlbmRlck9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGBJbmplY3RvcmAgdG8gdXNlIGR1cmluZyBjcmVhdGlvbi5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBub3QgcHJvdmlkZWQsIHRoZSBjdXJyZW50IGluamVjdGlvbiBjb250ZXh0IHdpbGwgYmUgdXNlZCBpbnN0ZWFkICh2aWEgYGluamVjdGApLlxuICAgKi9cbiAgaW5qZWN0b3I/OiBJbmplY3RvcjtcblxuICAvKipcbiAgICogVGhlIHBoYXNlIHRoZSBjYWxsYmFjayBzaG91bGQgYmUgaW52b2tlZCBpbi5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gICAqXG4gICAqIERlZmF1bHRzIHRvIGBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlYC4gWW91IHNob3VsZCBjaG9vc2UgYSBtb3JlIHNwZWNpZmljXG4gICAqIHBoYXNlIGluc3RlYWQuIFNlZSBgQWZ0ZXJSZW5kZXJQaGFzZWAgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgcGhhc2U/OiBBZnRlclJlbmRlclBoYXNlO1xufVxuXG4vKipcbiAqIEEgY2FsbGJhY2sgdGhhdCBydW5zIGFmdGVyIHJlbmRlci5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEFmdGVyUmVuZGVyUmVmIHtcbiAgLyoqXG4gICAqIFNodXQgZG93biB0aGUgY2FsbGJhY2ssIHByZXZlbnRpbmcgaXQgZnJvbSBiZWluZyBjYWxsZWQgYWdhaW4uXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQ7XG59XG5cbi8qKlxuICogT3B0aW9ucyBwYXNzZWQgdG8gYGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbEFmdGVyTmV4dFJlbmRlck9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGBJbmplY3RvcmAgdG8gdXNlIGR1cmluZyBjcmVhdGlvbi5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBub3QgcHJvdmlkZWQsIHRoZSBjdXJyZW50IGluamVjdGlvbiBjb250ZXh0IHdpbGwgYmUgdXNlZCBpbnN0ZWFkICh2aWEgYGluamVjdGApLlxuICAgKi9cbiAgaW5qZWN0b3I/OiBJbmplY3RvcjtcbiAgLyoqXG4gICAqIFdoZW4gdHJ1ZSwgdGhlIGhvb2sgd2lsbCBleGVjdXRlIGJvdGggb24gY2xpZW50IGFuZCBvbiB0aGUgc2VydmVyLlxuICAgKlxuICAgKiBXaGVuIGZhbHNlIG9yIHVuZGVmaW5lZCwgdGhlIGhvb2sgb25seSBleGVjdXRlcyBpbiB0aGUgYnJvd3Nlci5cbiAgICovXG4gIHJ1bk9uU2VydmVyPzogYm9vbGVhbjtcbn1cblxuLyoqIGBBZnRlclJlbmRlclJlZmAgdGhhdCBkb2VzIG5vdGhpbmcuICovXG5jb25zdCBOT09QX0FGVEVSX1JFTkRFUl9SRUY6IEFmdGVyUmVuZGVyUmVmID0ge1xuICBkZXN0cm95KCkge30sXG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gcnVuIG9uY2UgYmVmb3JlIGFueSB1c2Vyc3BhY2UgYGFmdGVyUmVuZGVyYCBvclxuICogYGFmdGVyTmV4dFJlbmRlcmAgY2FsbGJhY2tzLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gc2hvdWxkIGFsbW9zdCBhbHdheXMgYmUgdXNlZCBpbnN0ZWFkIG9mIGBhZnRlclJlbmRlcmAgb3JcbiAqIGBhZnRlck5leHRSZW5kZXJgIGZvciBpbXBsZW1lbnRpbmcgZnJhbWV3b3JrIGZ1bmN0aW9uYWxpdHkuIENvbnNpZGVyOlxuICpcbiAqICAgMS4pIGBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgaW1wbGVtZW50aW5nXG4gKiAgICAgICBjdXN0b20gbGF5b3V0LiBJZiB0aGUgZnJhbWV3b3JrIGl0c2VsZiBtdXRhdGVzIHRoZSBET00gYWZ0ZXIgKmFueSpcbiAqICAgICAgIGBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZGAgY2FsbGJhY2tzIGFyZSBydW4sIHRoZSBwaGFzZSBjYW4gbm9cbiAqICAgICAgIGxvbmdlciByZWxpYWJseSBzZXJ2ZSBpdHMgcHVycG9zZS5cbiAqXG4gKiAgIDIuKSBJbXBvcnRpbmcgYGFmdGVyUmVuZGVyYCBpbiB0aGUgZnJhbWV3b3JrIGNhbiByZWR1Y2UgdGhlIGFiaWxpdHkgZm9yIGl0XG4gKiAgICAgICB0byBiZSB0cmVlLXNoYWtlbiwgYW5kIHRoZSBmcmFtZXdvcmsgc2hvdWxkbid0IG5lZWQgbXVjaCBvZiB0aGUgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcihcbiAgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbixcbiAgb3B0aW9ucz86IEludGVybmFsQWZ0ZXJOZXh0UmVuZGVyT3B0aW9ucyxcbikge1xuICBjb25zdCBpbmplY3RvciA9IG9wdGlvbnM/LmluamVjdG9yID8/IGluamVjdChJbmplY3Rvcik7XG5cbiAgLy8gU2ltaWxhcmx5IHRvIHRoZSBwdWJsaWMgYGFmdGVyTmV4dFJlbmRlcmAgZnVuY3Rpb24sIGFuIGludGVybmFsIG9uZVxuICAvLyBpcyBvbmx5IGludm9rZWQgaW4gYSBicm93c2VyIGFzIGxvbmcgYXMgdGhlIHJ1bk9uU2VydmVyIG9wdGlvbiBpcyBub3Qgc2V0LlxuICBpZiAoIW9wdGlvbnM/LnJ1bk9uU2VydmVyICYmICFpc1BsYXRmb3JtQnJvd3NlcihpbmplY3RvcikpIHJldHVybjtcblxuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmludGVybmFsQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCBlYWNoIHRpbWUgdGhlIGFwcGxpY2F0aW9uXG4gKiBmaW5pc2hlcyByZW5kZXJpbmcuXG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gKlxuICogWW91IHNob3VsZCBhbHdheXMgZXhwbGljaXRseSBzcGVjaWZ5IGEgbm9uLWRlZmF1bHQgW3BoYXNlXShhcGkvY29yZS9BZnRlclJlbmRlclBoYXNlKSwgb3IgeW91XG4gKiByaXNrIHNpZ25pZmljYW50IHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uLlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uY2UgcGVyIHJlbmRlclxuICogLSBvbiBicm93c2VyIHBsYXRmb3JtcyBvbmx5XG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdG8gY29udHJvbCB0aGUgYmVoYXZpb3Igb2YgdGhlIGNhbGxiYWNrXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBVc2UgYGFmdGVyUmVuZGVyYCB0byByZWFkIG9yIHdyaXRlIHRoZSBET00gYWZ0ZXIgZWFjaCByZW5kZXIuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jbXAnLFxuICogICB0ZW1wbGF0ZTogYDxzcGFuICNjb250ZW50Pnt7IC4uLiB9fTwvc3Bhbj5gLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIEBWaWV3Q2hpbGQoJ2NvbnRlbnQnKSBjb250ZW50UmVmOiBFbGVtZW50UmVmO1xuICpcbiAqICAgY29uc3RydWN0b3IoKSB7XG4gKiAgICAgYWZ0ZXJSZW5kZXIoKCkgPT4ge1xuICogICAgICAgY29uc29sZS5sb2coJ2NvbnRlbnQgaGVpZ2h0OiAnICsgdGhpcy5jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQuc2Nyb2xsSGVpZ2h0KTtcbiAqICAgICB9LCB7cGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UuUmVhZH0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJSZW5kZXIoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyk6IEFmdGVyUmVuZGVyUmVmIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgYXNzZXJ0Tm90SW5SZWFjdGl2ZUNvbnRleHQoXG4gICAgICBhZnRlclJlbmRlcixcbiAgICAgICdDYWxsIGBhZnRlclJlbmRlcmAgb3V0c2lkZSBvZiBhIHJlYWN0aXZlIGNvbnRleHQuIEZvciBleGFtcGxlLCBzY2hlZHVsZSB0aGUgcmVuZGVyICcgK1xuICAgICAgICAnY2FsbGJhY2sgaW5zaWRlIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JgLicsXG4gICAgKTtcblxuICAhb3B0aW9ucyAmJiBhc3NlcnRJbkluamVjdGlvbkNvbnRleHQoYWZ0ZXJSZW5kZXIpO1xuICBjb25zdCBpbmplY3RvciA9IG9wdGlvbnM/LmluamVjdG9yID8/IGluamVjdChJbmplY3Rvcik7XG5cbiAgaWYgKCFpc1BsYXRmb3JtQnJvd3NlcihpbmplY3RvcikpIHtcbiAgICByZXR1cm4gTk9PUF9BRlRFUl9SRU5ERVJfUkVGO1xuICB9XG5cbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdBZnRlclJlbmRlcicpO1xuXG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgLy8gTGF6aWx5IGluaXRpYWxpemUgdGhlIGhhbmRsZXIgaW1wbGVtZW50YXRpb24sIGlmIG5lY2Vzc2FyeS4gVGhpcyBpcyBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyB0cmVlLXNoYWtlbiBpZiBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBhcmVuJ3QgdXNlZC5cbiAgY29uc3QgY2FsbGJhY2tIYW5kbGVyID0gKGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmhhbmRsZXIgPz89XG4gICAgbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCgpKTtcbiAgY29uc3QgcGhhc2UgPSBvcHRpb25zPy5waGFzZSA/PyBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlO1xuICBjb25zdCBkZXN0cm95ID0gKCkgPT4ge1xuICAgIGNhbGxiYWNrSGFuZGxlci51bnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgICB1bnJlZ2lzdGVyRm4oKTtcbiAgfTtcbiAgY29uc3QgdW5yZWdpc3RlckZuID0gaW5qZWN0b3IuZ2V0KERlc3Ryb3lSZWYpLm9uRGVzdHJveShkZXN0cm95KTtcbiAgY29uc3QgaW5zdGFuY2UgPSBydW5JbkluamVjdGlvbkNvbnRleHQoaW5qZWN0b3IsICgpID0+IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrKHBoYXNlLCBjYWxsYmFjaykpO1xuXG4gIGNhbGxiYWNrSGFuZGxlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHRoZSBuZXh0IHRpbWUgdGhlIGFwcGxpY2F0aW9uXG4gKiBmaW5pc2hlcyByZW5kZXJpbmcuXG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gKlxuICogWW91IHNob3VsZCBhbHdheXMgZXhwbGljaXRseSBzcGVjaWZ5IGEgbm9uLWRlZmF1bHQgW3BoYXNlXShhcGkvY29yZS9BZnRlclJlbmRlclBoYXNlKSwgb3IgeW91XG4gKiByaXNrIHNpZ25pZmljYW50IHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uLlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uIGJyb3dzZXIgcGxhdGZvcm1zIG9ubHlcbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtaW1wb3J0YW50XCI+XG4gKlxuICogQ29tcG9uZW50cyBhcmUgbm90IGd1YXJhbnRlZWQgdG8gYmUgW2h5ZHJhdGVkXShndWlkZS9oeWRyYXRpb24pIGJlZm9yZSB0aGUgY2FsbGJhY2sgcnVucy5cbiAqIFlvdSBtdXN0IHVzZSBjYXV0aW9uIHdoZW4gZGlyZWN0bHkgcmVhZGluZyBvciB3cml0aW5nIHRoZSBET00gYW5kIGxheW91dC5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZWdpc3RlclxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0byBjb250cm9sIHRoZSBiZWhhdmlvciBvZiB0aGUgY2FsbGJhY2tcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFVzZSBgYWZ0ZXJOZXh0UmVuZGVyYCB0byByZWFkIG9yIHdyaXRlIHRoZSBET00gb25jZSxcbiAqIGZvciBleGFtcGxlIHRvIGluaXRpYWxpemUgYSBub24tQW5ndWxhciBsaWJyYXJ5LlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0c1xuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbXktY2hhcnQtY21wJyxcbiAqICAgdGVtcGxhdGU6IGA8ZGl2ICNjaGFydD57eyAuLi4gfX08L2Rpdj5gLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBNeUNoYXJ0Q21wIHtcbiAqICAgQFZpZXdDaGlsZCgnY2hhcnQnKSBjaGFydFJlZjogRWxlbWVudFJlZjtcbiAqICAgY2hhcnQ6IE15Q2hhcnR8bnVsbDtcbiAqXG4gKiAgIGNvbnN0cnVjdG9yKCkge1xuICogICAgIGFmdGVyTmV4dFJlbmRlcigoKSA9PiB7XG4gKiAgICAgICB0aGlzLmNoYXJ0ID0gbmV3IE15Q2hhcnQodGhpcy5jaGFydFJlZi5uYXRpdmVFbGVtZW50KTtcbiAqICAgICB9LCB7cGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UuV3JpdGV9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyTmV4dFJlbmRlcihcbiAgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbixcbiAgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyxcbik6IEFmdGVyUmVuZGVyUmVmIHtcbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyTmV4dFJlbmRlcik7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICBpZiAoIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkge1xuICAgIHJldHVybiBOT09QX0FGVEVSX1JFTkRFUl9SRUY7XG4gIH1cblxuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ0FmdGVyTmV4dFJlbmRlcicpO1xuXG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgLy8gTGF6aWx5IGluaXRpYWxpemUgdGhlIGhhbmRsZXIgaW1wbGVtZW50YXRpb24sIGlmIG5lY2Vzc2FyeS4gVGhpcyBpcyBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyB0cmVlLXNoYWtlbiBpZiBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBhcmVuJ3QgdXNlZC5cbiAgY29uc3QgY2FsbGJhY2tIYW5kbGVyID0gKGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmhhbmRsZXIgPz89XG4gICAgbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCgpKTtcbiAgY29uc3QgcGhhc2UgPSBvcHRpb25zPy5waGFzZSA/PyBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlO1xuICBjb25zdCBkZXN0cm95ID0gKCkgPT4ge1xuICAgIGNhbGxiYWNrSGFuZGxlci51bnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgICB1bnJlZ2lzdGVyRm4oKTtcbiAgfTtcbiAgY29uc3QgdW5yZWdpc3RlckZuID0gaW5qZWN0b3IuZ2V0KERlc3Ryb3lSZWYpLm9uRGVzdHJveShkZXN0cm95KTtcbiAgY29uc3QgaW5zdGFuY2UgPSBydW5JbkluamVjdGlvbkNvbnRleHQoXG4gICAgaW5qZWN0b3IsXG4gICAgKCkgPT5cbiAgICAgIG5ldyBBZnRlclJlbmRlckNhbGxiYWNrKHBoYXNlLCAoKSA9PiB7XG4gICAgICAgIGRlc3Ryb3koKTtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0pLFxuICApO1xuXG4gIGNhbGxiYWNrSGFuZGxlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCBhIGZ1bmN0aW9uIHRvIGJlIHVzZWQgYXMgYW4gYWZ0ZXIgcmVuZGVyIGNhbGxiYWNrLlxuICovXG5jbGFzcyBBZnRlclJlbmRlckNhbGxiYWNrIHtcbiAgcHJpdmF0ZSB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgZXJyb3JIYW5kbGVyID0gaW5qZWN0KEVycm9ySGFuZGxlciwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcmVhZG9ubHkgcGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UsXG4gICAgcHJpdmF0ZSBjYWxsYmFja0ZuOiBWb2lkRnVuY3Rpb24sXG4gICkge1xuICAgIC8vIFJlZ2lzdGVyaW5nIGEgY2FsbGJhY2sgd2lsbCBub3RpZnkgdGhlIHNjaGVkdWxlci5cbiAgICBpbmplY3QoQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB7b3B0aW9uYWw6IHRydWV9KT8ubm90aWZ5KE5vdGlmaWNhdGlvblNvdXJjZS5OZXdSZW5kZXJIb29rKTtcbiAgfVxuXG4gIGludm9rZSgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKHRoaXMuY2FsbGJhY2tGbik7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLmVycm9ySGFuZGxlcj8uaGFuZGxlRXJyb3IoZXJyKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGNhbGxiYWNrIGhhbmRsZXIgbG9naWMuXG4gKi9cbmludGVyZmFjZSBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlciB7XG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIG5ldyBjYWxsYmFjay5cbiAgICovXG4gIHJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZDtcblxuICAvKipcbiAgICogVW5yZWdpc3RlciBhbiBleGlzdGluZyBjYWxsYmFjay5cbiAgICovXG4gIHVucmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBFeGVjdXRlIGNhbGxiYWNrcy4gUmV0dXJucyBgdHJ1ZWAgaWYgYW55IGNhbGxiYWNrcyB3ZXJlIGV4ZWN1dGVkLlxuICAgKi9cbiAgZXhlY3V0ZSgpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGFueSBuZWNlc3NhcnkgY2xlYW51cC5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZDtcbn1cblxuLyoqXG4gKiBDb3JlIGZ1bmN0aW9uYWxpdHkgZm9yIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgLiBLZXB0IHNlcGFyYXRlIGZyb21cbiAqIGBBZnRlclJlbmRlckV2ZW50TWFuYWdlcmAgZm9yIHRyZWUtc2hha2luZy5cbiAqL1xuY2xhc3MgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsIGltcGxlbWVudHMgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXIge1xuICBwcml2YXRlIGV4ZWN1dGluZ0NhbGxiYWNrcyA9IGZhbHNlO1xuICBwcml2YXRlIGJ1Y2tldHMgPSB7XG4gICAgLy8gTm90ZTogdGhlIG9yZGVyIG9mIHRoZXNlIGtleXMgY29udHJvbHMgdGhlIG9yZGVyIHRoZSBwaGFzZXMgYXJlIHJ1bi5cbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuV3JpdGVdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuUmVhZF06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgfTtcbiAgcHJpdmF0ZSBkZWZlcnJlZENhbGxiYWNrcyA9IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKTtcblxuICByZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQge1xuICAgIC8vIElmIHdlJ3JlIGN1cnJlbnRseSBydW5uaW5nIGNhbGxiYWNrcywgbmV3IGNhbGxiYWNrcyBzaG91bGQgYmUgZGVmZXJyZWRcbiAgICAvLyB1bnRpbCB0aGUgbmV4dCByZW5kZXIgb3BlcmF0aW9uLlxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID8gdGhpcy5kZWZlcnJlZENhbGxiYWNrcyA6IHRoaXMuYnVja2V0c1tjYWxsYmFjay5waGFzZV07XG4gICAgdGFyZ2V0LmFkZChjYWxsYmFjayk7XG4gIH1cblxuICB1bnJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZCB7XG4gICAgdGhpcy5idWNrZXRzW2NhbGxiYWNrLnBoYXNlXS5kZWxldGUoY2FsbGJhY2spO1xuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcbiAgfVxuXG4gIGV4ZWN1dGUoKTogdm9pZCB7XG4gICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSB0cnVlO1xuICAgIGZvciAoY29uc3QgYnVja2V0IG9mIE9iamVjdC52YWx1ZXModGhpcy5idWNrZXRzKSkge1xuICAgICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiBidWNrZXQpIHtcbiAgICAgICAgY2FsbGJhY2suaW52b2tlKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG5cbiAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MpIHtcbiAgICAgIHRoaXMuYnVja2V0c1tjYWxsYmFjay5waGFzZV0uYWRkKGNhbGxiYWNrKTtcbiAgICB9XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5jbGVhcigpO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGJ1Y2tldCBvZiBPYmplY3QudmFsdWVzKHRoaXMuYnVja2V0cykpIHtcbiAgICAgIGJ1Y2tldC5jbGVhcigpO1xuICAgIH1cbiAgICB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzLmNsZWFyKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGNvcmUgdGltaW5nIGZvciBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBldmVudHMuXG4gKiBEZWxlZ2F0ZXMgdG8gYW4gb3B0aW9uYWwgYEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyYCBmb3IgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBBZnRlclJlbmRlckV2ZW50TWFuYWdlciB7XG4gIC8qIEBpbnRlcm5hbCAqL1xuICBoYW5kbGVyOiBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlciB8IG51bGwgPSBudWxsO1xuXG4gIC8qIEBpbnRlcm5hbCAqL1xuICBpbnRlcm5hbENhbGxiYWNrczogVm9pZEZ1bmN0aW9uW10gPSBbXTtcblxuICAvKipcbiAgICogRXhlY3V0ZXMgaW50ZXJuYWwgYW5kIHVzZXItcHJvdmlkZWQgY2FsbGJhY2tzLlxuICAgKi9cbiAgZXhlY3V0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLmV4ZWN1dGVJbnRlcm5hbENhbGxiYWNrcygpO1xuICAgIHRoaXMuaGFuZGxlcj8uZXhlY3V0ZSgpO1xuICB9XG5cbiAgZXhlY3V0ZUludGVybmFsQ2FsbGJhY2tzKCkge1xuICAgIC8vIE5vdGU6IGludGVybmFsIGNhbGxiYWNrcyBwb3dlciBgaW50ZXJuYWxBZnRlck5leHRSZW5kZXJgLiBTaW5jZSBpbnRlcm5hbCBjYWxsYmFja3NcbiAgICAvLyBhcmUgZmFpcmx5IHRyaXZpYWwsIHRoZXkgYXJlIGtlcHQgc2VwYXJhdGUgc28gdGhhdCBgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsYFxuICAgIC8vIGNhbiBzdGlsbCBiZSB0cmVlLXNoYWtlbiB1bmxlc3MgdXNlZCBieSB0aGUgYXBwbGljYXRpb24uXG4gICAgY29uc3QgY2FsbGJhY2tzID0gWy4uLnRoaXMuaW50ZXJuYWxDYWxsYmFja3NdO1xuICAgIHRoaXMuaW50ZXJuYWxDYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIGNhbGxiYWNrcykge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmhhbmRsZXI/LmRlc3Ryb3koKTtcbiAgICB0aGlzLmhhbmRsZXIgPSBudWxsO1xuICAgIHRoaXMuaW50ZXJuYWxDYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIoKSxcbiAgfSk7XG59XG4iXX0=