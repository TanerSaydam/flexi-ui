/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isSupportedEvent, isCaptureEvent, EventContractContainer, EventContract, EventDispatcher, registerDispatcher, } from '@angular/core/primitives/event-dispatch';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef, whenStable } from '../application/application_ref';
import { ENVIRONMENT_INITIALIZER, Injector } from '../di';
import { inject } from '../di/injector_compatibility';
import { setStashFn } from '../render3/instructions/listener';
import { CLEANUP } from '../render3/interfaces/view';
import { isPlatformBrowser } from '../render3/util/misc_utils';
import { unwrapRNode } from '../render3/util/view_utils';
import { EVENT_REPLAY_ENABLED_DEFAULT, IS_EVENT_REPLAY_ENABLED, IS_GLOBAL_EVENT_DELEGATION_ENABLED, } from './tokens';
import { GlobalEventDelegation, sharedStashFunction, removeListeners, invokeRegisteredListeners, } from '../event_delegation_utils';
import { APP_ID } from '../application/application_tokens';
import { performanceMarkFeature } from '../util/performance';
export const CONTRACT_PROPERTY = 'ngContracts';
/**
 * A set of DOM elements with `jsaction` attributes.
 */
const jsactionSet = new Set();
function isGlobalEventDelegationEnabled(injector) {
    return injector.get(IS_GLOBAL_EVENT_DELEGATION_ENABLED, false);
}
/**
 * Determines whether Event Replay feature should be activated on the client.
 */
function shouldEnableEventReplay(injector) {
    return (injector.get(IS_EVENT_REPLAY_ENABLED, EVENT_REPLAY_ENABLED_DEFAULT) &&
        !isGlobalEventDelegationEnabled(injector));
}
/**
 * Returns a set of providers required to setup support for event replay.
 * Requires hydration to be enabled separately.
 */
export function withEventReplay() {
    return [
        {
            provide: IS_EVENT_REPLAY_ENABLED,
            useFactory: () => {
                let isEnabled = true;
                if (isPlatformBrowser()) {
                    // Note: globalThis[CONTRACT_PROPERTY] may be undefined in case Event Replay feature
                    // is enabled, but there are no events configured in this application, in which case
                    // we don't activate this feature, since there are no events to replay.
                    const appId = inject(APP_ID);
                    isEnabled = !!globalThis[CONTRACT_PROPERTY]?.[appId];
                }
                if (isEnabled) {
                    performanceMarkFeature('NgEventReplay');
                }
                return isEnabled;
            },
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                const injector = inject(Injector);
                if (isPlatformBrowser(injector) && shouldEnableEventReplay(injector)) {
                    setStashFn((rEl, eventName, listenerFn) => {
                        sharedStashFunction(rEl, eventName, listenerFn);
                        jsactionSet.add(rEl);
                    });
                }
            },
            multi: true,
        },
        {
            provide: APP_BOOTSTRAP_LISTENER,
            useFactory: () => {
                if (isPlatformBrowser()) {
                    const injector = inject(Injector);
                    const appRef = inject(ApplicationRef);
                    return () => {
                        if (!shouldEnableEventReplay(injector)) {
                            return;
                        }
                        // Kick off event replay logic once hydration for the initial part
                        // of the application is completed. This timing is similar to the unclaimed
                        // dehydrated views cleanup timing.
                        whenStable(appRef).then(() => {
                            const globalEventDelegation = injector.get(GlobalEventDelegation);
                            initEventReplay(globalEventDelegation, injector);
                            jsactionSet.forEach(removeListeners);
                            // After hydration, we shouldn't need to do anymore work related to
                            // event replay anymore.
                            setStashFn(() => { });
                        });
                    };
                }
                return () => { }; // noop for the server code
            },
            multi: true,
        },
    ];
}
// TODO: Upstream this back into event-dispatch.
function getJsactionData(container) {
    return container._ejsa;
}
const initEventReplay = (eventDelegation, injector) => {
    const appId = injector.get(APP_ID);
    // This is set in packages/platform-server/src/utils.ts
    const container = globalThis[CONTRACT_PROPERTY]?.[appId];
    const earlyJsactionData = getJsactionData(container);
    const eventContract = (eventDelegation.eventContract = new EventContract(new EventContractContainer(earlyJsactionData.c), 
    /* useActionResolver= */ false));
    for (const et of earlyJsactionData.et) {
        eventContract.addEvent(et);
    }
    for (const et of earlyJsactionData.etc) {
        eventContract.addEvent(et);
    }
    eventContract.replayEarlyEvents(container);
    const dispatcher = new EventDispatcher(invokeRegisteredListeners);
    registerDispatcher(eventContract, dispatcher);
};
/**
 * Extracts information about all DOM events (added in a template) registered on elements in a give
 * LView. Maps collected events to a corresponding DOM element (an element is used as a key).
 */
export function collectDomEventsInfo(tView, lView, eventTypesToReplay) {
    const events = new Map();
    const lCleanup = lView[CLEANUP];
    const tCleanup = tView.cleanup;
    if (!tCleanup || !lCleanup) {
        return events;
    }
    for (let i = 0; i < tCleanup.length;) {
        const firstParam = tCleanup[i++];
        const secondParam = tCleanup[i++];
        if (typeof firstParam !== 'string') {
            continue;
        }
        const name = firstParam;
        if (!isSupportedEvent(name)) {
            continue;
        }
        if (isCaptureEvent(name)) {
            eventTypesToReplay.capture.add(name);
        }
        else {
            eventTypesToReplay.regular.add(name);
        }
        const listenerElement = unwrapRNode(lView[secondParam]);
        i++; // move the cursor to the next position (location of the listener idx)
        const useCaptureOrIndx = tCleanup[i++];
        // if useCaptureOrIndx is boolean then report it as is.
        // if useCaptureOrIndx is positive number then it in unsubscribe method
        // if useCaptureOrIndx is negative number then it is a Subscription
        const isDomEvent = typeof useCaptureOrIndx === 'boolean' || useCaptureOrIndx >= 0;
        if (!isDomEvent) {
            continue;
        }
        if (!events.has(listenerElement)) {
            events.set(listenerElement, [name]);
        }
        else {
            events.get(listenerElement).push(name);
        }
    }
    return events;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfcmVwbGF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2V2ZW50X3JlcGxheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsZ0JBQWdCLEVBQ2hCLGNBQWMsRUFDZCxzQkFBc0IsRUFDdEIsYUFBYSxFQUNiLGVBQWUsRUFDZixrQkFBa0IsR0FFbkIsTUFBTSx5Q0FBeUMsQ0FBQztBQUVqRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ2xHLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxRQUFRLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDeEQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRXBELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUU1RCxPQUFPLEVBQUMsT0FBTyxFQUFlLE1BQU0sNEJBQTRCLENBQUM7QUFDakUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDN0QsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBRXZELE9BQU8sRUFDTCw0QkFBNEIsRUFDNUIsdUJBQXVCLEVBQ3ZCLGtDQUFrQyxHQUNuQyxNQUFNLFVBQVUsQ0FBQztBQUNsQixPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLG1CQUFtQixFQUNuQixlQUFlLEVBQ2YseUJBQXlCLEdBQzFCLE1BQU0sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQ3pELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBTTNELE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQztBQUUvQzs7R0FF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QUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2Qyx1REFBdUQ7UUFDdkQsdUVBQXVFO1FBQ3ZFLG1FQUFtRTtRQUNuRSxNQUFNLFVBQVUsR0FBRyxPQUFPLGdCQUFnQixLQUFLLFNBQVMsSUFBSSxnQkFBZ0IsSUFBSSxDQUFDLENBQUM7UUFDbEYsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLFNBQVM7UUFDWCxDQUFDO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztZQUNqQyxNQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDdEMsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQyxDQUFDO0lBQ0gsQ0FBQztJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgaXNTdXBwb3J0ZWRFdmVudCxcbiAgaXNDYXB0dXJlRXZlbnQsXG4gIEV2ZW50Q29udHJhY3RDb250YWluZXIsXG4gIEV2ZW50Q29udHJhY3QsXG4gIEV2ZW50RGlzcGF0Y2hlcixcbiAgcmVnaXN0ZXJEaXNwYXRjaGVyLFxuICBFYXJseUpzYWN0aW9uRGF0YUNvbnRhaW5lcixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoJztcblxuaW1wb3J0IHtBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBBcHBsaWNhdGlvblJlZiwgd2hlblN0YWJsZX0gZnJvbSAnLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7RU5WSVJPTk1FTlRfSU5JVElBTElaRVIsIEluamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1Byb3ZpZGVyfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtzZXRTdGFzaEZufSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy9saXN0ZW5lcic7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7Q0xFQU5VUCwgTFZpZXcsIFRWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge3Vud3JhcFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7XG4gIEVWRU5UX1JFUExBWV9FTkFCTEVEX0RFRkFVTFQsXG4gIElTX0VWRU5UX1JFUExBWV9FTkFCTEVELFxuICBJU19HTE9CQUxfRVZFTlRfREVMRUdBVElPTl9FTkFCTEVELFxufSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge1xuICBHbG9iYWxFdmVudERlbGVnYXRpb24sXG4gIHNoYXJlZFN0YXNoRnVuY3Rpb24sXG4gIHJlbW92ZUxpc3RlbmVycyxcbiAgaW52b2tlUmVnaXN0ZXJlZExpc3RlbmVycyxcbn0gZnJvbSAnLi4vZXZlbnRfZGVsZWdhdGlvbl91dGlscyc7XG5pbXBvcnQge0FQUF9JRH0gZnJvbSAnLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgdmFyIG5nQ29udHJhY3RzOiB7W2tleTogc3RyaW5nXTogRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXJ9O1xufVxuXG5leHBvcnQgY29uc3QgQ09OVFJBQ1RfUFJPUEVSVFkgPSAnbmdDb250cmFjdHMnO1xuXG4vKipcbiAqIEEgc2V0IG9mIERPTSBlbGVtZW50cyB3aXRoIGBqc2FjdGlvbmAgYXR0cmlidXRlcy5cbiAqL1xuY29uc3QganNhY3Rpb25TZXQgPSBuZXcgU2V0PEVsZW1lbnQ+KCk7XG5cbmZ1bmN0aW9uIGlzR2xvYmFsRXZlbnREZWxlZ2F0aW9uRW5hYmxlZChpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgcmV0dXJuIGluamVjdG9yLmdldChJU19HTE9CQUxfRVZFTlRfREVMRUdBVElPTl9FTkFCTEVELCBmYWxzZSk7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIEV2ZW50IFJlcGxheSBmZWF0dXJlIHNob3VsZCBiZSBhY3RpdmF0ZWQgb24gdGhlIGNsaWVudC5cbiAqL1xuZnVuY3Rpb24gc2hvdWxkRW5hYmxlRXZlbnRSZXBsYXkoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gIHJldHVybiAoXG4gICAgaW5qZWN0b3IuZ2V0KElTX0VWRU5UX1JFUExBWV9FTkFCTEVELCBFVkVOVF9SRVBMQVlfRU5BQkxFRF9ERUZBVUxUKSAmJlxuICAgICFpc0dsb2JhbEV2ZW50RGVsZWdhdGlvbkVuYWJsZWQoaW5qZWN0b3IpXG4gICk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHNldCBvZiBwcm92aWRlcnMgcmVxdWlyZWQgdG8gc2V0dXAgc3VwcG9ydCBmb3IgZXZlbnQgcmVwbGF5LlxuICogUmVxdWlyZXMgaHlkcmF0aW9uIHRvIGJlIGVuYWJsZWQgc2VwYXJhdGVseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhFdmVudFJlcGxheSgpOiBQcm92aWRlcltdIHtcbiAgcmV0dXJuIFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBJU19FVkVOVF9SRVBMQVlfRU5BQkxFRCxcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgbGV0IGlzRW5hYmxlZCA9IHRydWU7XG4gICAgICAgIGlmIChpc1BsYXRmb3JtQnJvd3NlcigpKSB7XG4gICAgICAgICAgLy8gTm90ZTogZ2xvYmFsVGhpc1tDT05UUkFDVF9QUk9QRVJUWV0gbWF5IGJlIHVuZGVmaW5lZCBpbiBjYXNlIEV2ZW50IFJlcGxheSBmZWF0dXJlXG4gICAgICAgICAgLy8gaXMgZW5hYmxlZCwgYnV0IHRoZXJlIGFyZSBubyBldmVudHMgY29uZmlndXJlZCBpbiB0aGlzIGFwcGxpY2F0aW9uLCBpbiB3aGljaCBjYXNlXG4gICAgICAgICAgLy8gd2UgZG9uJ3QgYWN0aXZhdGUgdGhpcyBmZWF0dXJlLCBzaW5jZSB0aGVyZSBhcmUgbm8gZXZlbnRzIHRvIHJlcGxheS5cbiAgICAgICAgICBjb25zdCBhcHBJZCA9IGluamVjdChBUFBfSUQpO1xuICAgICAgICAgIGlzRW5hYmxlZCA9ICEhZ2xvYmFsVGhpc1tDT05UUkFDVF9QUk9QRVJUWV0/LlthcHBJZF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRW5hYmxlZCkge1xuICAgICAgICAgIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nRXZlbnRSZXBsYXknKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXNFbmFibGVkO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICAgICAgdXNlVmFsdWU6ICgpID0+IHtcbiAgICAgICAgY29uc3QgaW5qZWN0b3IgPSBpbmplY3QoSW5qZWN0b3IpO1xuICAgICAgICBpZiAoaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpICYmIHNob3VsZEVuYWJsZUV2ZW50UmVwbGF5KGluamVjdG9yKSkge1xuICAgICAgICAgIHNldFN0YXNoRm4oKHJFbDogUkVsZW1lbnQsIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiBWb2lkRnVuY3Rpb24pID0+IHtcbiAgICAgICAgICAgIHNoYXJlZFN0YXNoRnVuY3Rpb24ockVsLCBldmVudE5hbWUsIGxpc3RlbmVyRm4pO1xuICAgICAgICAgICAganNhY3Rpb25TZXQuYWRkKHJFbCBhcyB1bmtub3duIGFzIEVsZW1lbnQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICBpZiAoaXNQbGF0Zm9ybUJyb3dzZXIoKSkge1xuICAgICAgICAgIGNvbnN0IGluamVjdG9yID0gaW5qZWN0KEluamVjdG9yKTtcbiAgICAgICAgICBjb25zdCBhcHBSZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXNob3VsZEVuYWJsZUV2ZW50UmVwbGF5KGluamVjdG9yKSkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEtpY2sgb2ZmIGV2ZW50IHJlcGxheSBsb2dpYyBvbmNlIGh5ZHJhdGlvbiBmb3IgdGhlIGluaXRpYWwgcGFydFxuICAgICAgICAgICAgLy8gb2YgdGhlIGFwcGxpY2F0aW9uIGlzIGNvbXBsZXRlZC4gVGhpcyB0aW1pbmcgaXMgc2ltaWxhciB0byB0aGUgdW5jbGFpbWVkXG4gICAgICAgICAgICAvLyBkZWh5ZHJhdGVkIHZpZXdzIGNsZWFudXAgdGltaW5nLlxuICAgICAgICAgICAgd2hlblN0YWJsZShhcHBSZWYpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBnbG9iYWxFdmVudERlbGVnYXRpb24gPSBpbmplY3Rvci5nZXQoR2xvYmFsRXZlbnREZWxlZ2F0aW9uKTtcbiAgICAgICAgICAgICAgaW5pdEV2ZW50UmVwbGF5KGdsb2JhbEV2ZW50RGVsZWdhdGlvbiwgaW5qZWN0b3IpO1xuICAgICAgICAgICAgICBqc2FjdGlvblNldC5mb3JFYWNoKHJlbW92ZUxpc3RlbmVycyk7XG4gICAgICAgICAgICAgIC8vIEFmdGVyIGh5ZHJhdGlvbiwgd2Ugc2hvdWxkbid0IG5lZWQgdG8gZG8gYW55bW9yZSB3b3JrIHJlbGF0ZWQgdG9cbiAgICAgICAgICAgICAgLy8gZXZlbnQgcmVwbGF5IGFueW1vcmUuXG4gICAgICAgICAgICAgIHNldFN0YXNoRm4oKCkgPT4ge30pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKCkgPT4ge307IC8vIG5vb3AgZm9yIHRoZSBzZXJ2ZXIgY29kZVxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gIF07XG59XG5cbi8vIFRPRE86IFVwc3RyZWFtIHRoaXMgYmFjayBpbnRvIGV2ZW50LWRpc3BhdGNoLlxuZnVuY3Rpb24gZ2V0SnNhY3Rpb25EYXRhKGNvbnRhaW5lcjogRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIpIHtcbiAgcmV0dXJuIGNvbnRhaW5lci5fZWpzYTtcbn1cblxuY29uc3QgaW5pdEV2ZW50UmVwbGF5ID0gKGV2ZW50RGVsZWdhdGlvbjogR2xvYmFsRXZlbnREZWxlZ2F0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpID0+IHtcbiAgY29uc3QgYXBwSWQgPSBpbmplY3Rvci5nZXQoQVBQX0lEKTtcbiAgLy8gVGhpcyBpcyBzZXQgaW4gcGFja2FnZXMvcGxhdGZvcm0tc2VydmVyL3NyYy91dGlscy50c1xuICBjb25zdCBjb250YWluZXIgPSBnbG9iYWxUaGlzW0NPTlRSQUNUX1BST1BFUlRZXT8uW2FwcElkXTtcbiAgY29uc3QgZWFybHlKc2FjdGlvbkRhdGEgPSBnZXRKc2FjdGlvbkRhdGEoY29udGFpbmVyKSE7XG4gIGNvbnN0IGV2ZW50Q29udHJhY3QgPSAoZXZlbnREZWxlZ2F0aW9uLmV2ZW50Q29udHJhY3QgPSBuZXcgRXZlbnRDb250cmFjdChcbiAgICBuZXcgRXZlbnRDb250cmFjdENvbnRhaW5lcihlYXJseUpzYWN0aW9uRGF0YS5jKSxcbiAgICAvKiB1c2VBY3Rpb25SZXNvbHZlcj0gKi8gZmFsc2UsXG4gICkpO1xuICBmb3IgKGNvbnN0IGV0IG9mIGVhcmx5SnNhY3Rpb25EYXRhLmV0KSB7XG4gICAgZXZlbnRDb250cmFjdC5hZGRFdmVudChldCk7XG4gIH1cbiAgZm9yIChjb25zdCBldCBvZiBlYXJseUpzYWN0aW9uRGF0YS5ldGMpIHtcbiAgICBldmVudENvbnRyYWN0LmFkZEV2ZW50KGV0KTtcbiAgfVxuICBldmVudENvbnRyYWN0LnJlcGxheUVhcmx5RXZlbnRzKGNvbnRhaW5lcik7XG4gIGNvbnN0IGRpc3BhdGNoZXIgPSBuZXcgRXZlbnREaXNwYXRjaGVyKGludm9rZVJlZ2lzdGVyZWRMaXN0ZW5lcnMpO1xuICByZWdpc3RlckRpc3BhdGNoZXIoZXZlbnRDb250cmFjdCwgZGlzcGF0Y2hlcik7XG59O1xuXG4vKipcbiAqIEV4dHJhY3RzIGluZm9ybWF0aW9uIGFib3V0IGFsbCBET00gZXZlbnRzIChhZGRlZCBpbiBhIHRlbXBsYXRlKSByZWdpc3RlcmVkIG9uIGVsZW1lbnRzIGluIGEgZ2l2ZVxuICogTFZpZXcuIE1hcHMgY29sbGVjdGVkIGV2ZW50cyB0byBhIGNvcnJlc3BvbmRpbmcgRE9NIGVsZW1lbnQgKGFuIGVsZW1lbnQgaXMgdXNlZCBhcyBhIGtleSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0RG9tRXZlbnRzSW5mbyhcbiAgdFZpZXc6IFRWaWV3LFxuICBsVmlldzogTFZpZXcsXG4gIGV2ZW50VHlwZXNUb1JlcGxheToge3JlZ3VsYXI6IFNldDxzdHJpbmc+OyBjYXB0dXJlOiBTZXQ8c3RyaW5nPn0sXG4pOiBNYXA8RWxlbWVudCwgc3RyaW5nW10+IHtcbiAgY29uc3QgZXZlbnRzID0gbmV3IE1hcDxFbGVtZW50LCBzdHJpbmdbXT4oKTtcbiAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXTtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBpZiAoIXRDbGVhbnVwIHx8ICFsQ2xlYW51cCkge1xuICAgIHJldHVybiBldmVudHM7XG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Q2xlYW51cC5sZW5ndGg7ICkge1xuICAgIGNvbnN0IGZpcnN0UGFyYW0gPSB0Q2xlYW51cFtpKytdO1xuICAgIGNvbnN0IHNlY29uZFBhcmFtID0gdENsZWFudXBbaSsrXTtcbiAgICBpZiAodHlwZW9mIGZpcnN0UGFyYW0gIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgbmFtZTogc3RyaW5nID0gZmlyc3RQYXJhbTtcbiAgICBpZiAoIWlzU3VwcG9ydGVkRXZlbnQobmFtZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoaXNDYXB0dXJlRXZlbnQobmFtZSkpIHtcbiAgICAgIGV2ZW50VHlwZXNUb1JlcGxheS5jYXB0dXJlLmFkZChuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXZlbnRUeXBlc1RvUmVwbGF5LnJlZ3VsYXIuYWRkKG5hbWUpO1xuICAgIH1cbiAgICBjb25zdCBsaXN0ZW5lckVsZW1lbnQgPSB1bndyYXBSTm9kZShsVmlld1tzZWNvbmRQYXJhbV0pIGFzIGFueSBhcyBFbGVtZW50O1xuICAgIGkrKzsgLy8gbW92ZSB0aGUgY3Vyc29yIHRvIHRoZSBuZXh0IHBvc2l0aW9uIChsb2NhdGlvbiBvZiB0aGUgbGlzdGVuZXIgaWR4KVxuICAgIGNvbnN0IHVzZUNhcHR1cmVPckluZHggPSB0Q2xlYW51cFtpKytdO1xuICAgIC8vIGlmIHVzZUNhcHR1cmVPckluZHggaXMgYm9vbGVhbiB0aGVuIHJlcG9ydCBpdCBhcyBpcy5cbiAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIHBvc2l0aXZlIG51bWJlciB0aGVuIGl0IGluIHVuc3Vic2NyaWJlIG1ldGhvZFxuICAgIC8vIGlmIHVzZUNhcHR1cmVPckluZHggaXMgbmVnYXRpdmUgbnVtYmVyIHRoZW4gaXQgaXMgYSBTdWJzY3JpcHRpb25cbiAgICBjb25zdCBpc0RvbUV2ZW50ID0gdHlwZW9mIHVzZUNhcHR1cmVPckluZHggPT09ICdib29sZWFuJyB8fCB1c2VDYXB0dXJlT3JJbmR4ID49IDA7XG4gICAgaWYgKCFpc0RvbUV2ZW50KSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKCFldmVudHMuaGFzKGxpc3RlbmVyRWxlbWVudCkpIHtcbiAgICAgIGV2ZW50cy5zZXQobGlzdGVuZXJFbGVtZW50LCBbbmFtZV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBldmVudHMuZ2V0KGxpc3RlbmVyRWxlbWVudCkhLnB1c2gobmFtZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBldmVudHM7XG59XG4iXX0=