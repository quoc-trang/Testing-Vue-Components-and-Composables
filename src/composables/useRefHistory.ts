import type { Ref, MaybeRefOrGetter, UnwrapRef } from "vue";
import { ref, watch, nextTick, watchEffect, toValue } from "vue";

// First we accept a source ref and a capacity
// For TS devs, notice that capacity is a MaybeRefOrGetter
// (this means it can be a number, a ref that's a number a computed prop that's a number or a function that returns a number (getter))
export const useRefHistory = <T>(
  source: Ref<T>,
  capacity: MaybeRefOrGetter<number> = Infinity,
) => {
  // For TS devs, we create an interface for the history record
  interface HistoryRecord {
    value: T;
    timestamp: number;
  }

  // We create a history ref to store the history records everytime the source value changes
  const history = ref<HistoryRecord[]>([]);

  // We create a future ref to store the future records when we undo (so that we can redo again)
  const future = ref<HistoryRecord[]>([]);

  // We create two flags to prevent watching the source for changes
  // and counting it as a new history entry
  // while we're undoing/redoing
  let doingUndo = false;
  let doingRedo = false;

  // We create a timestamp to store the last time the source value changed
  // this is necessary to add the proper timestamp to the history record
  // you'll see what I mean below
  let lastChanged = Date.now();

  // Here we watch the source for changes
  watch(source, (newVal, oldValue) => {
    // If we're undoing or redoing, we don't want to add a new history record
    // so just return early and do nothing
    if (doingUndo || doingRedo) return;

    // If the source value changes, we want to clear the future
    // that's because a manual source change means we can't redo anymore
    future.value = [];

    // We use toValue to get the actual value of the capacity
    // because it can be a plain number, a ref, a computed prop or a function
    // https://vuejs.org/api/reactivity-utilities#tovalue
    const cap = toValue(capacity);

    // If the capacity is 0, we don't want to store any history
    if (cap === 0) return;
    // If history is at capacity, we need to remove the oldest record
    if (cap === history.value.length) history.value.pop();

    // We add a new history record to the history
    history.value.unshift(
      clone({
        value: oldValue,
        timestamp: lastChanged,
      }),
    );

    // We update the lastChanged timestamp since the next record
    // will be for the current value and it's JUST changed
    lastChanged = Date.now();
  });

  // The undo function...
  function undo() {
    doingUndo = true;
    /// removes the latest record from history
    const record = history.value.shift();

    // and if it exists stores it in the future array for use with redo
    if (record) {
      future.value.unshift(
        clone({
          value: source.value,
          timestamp: Date.now(),
        }),
      );

      // then sets the source value to the value of the record
      source.value = clone(record.value);
    }

    // nextTick is used to make sure the doingUndo flag is set to false
    // only AFTER the source value has been updated
    // and our watcher will correctly see that doingUndo is still true until now
    nextTick(() => (doingUndo = false));
  }

  // redo does the opposite of undo
  function redo() {
    doingRedo = true;
    const record = future.value.shift();
    if (record) {
      history.value.unshift(
        clone({
          value: source.value,
          timestamp: Date.now(),
        }),
      );
      source.value = clone(record.value);
    }
    nextTick(() => {
      doingRedo = false;
    });
  }

  // Finally, we watch the capacity for changes...
  watchEffect(() => {
    const cap = toValue(capacity);
    // and if the capacity becomes less than the current history length
    if (history.value.length > cap) {
      // we remove the oldest records to match the new capacity
      history.value = history.value.slice(0, cap);
    }
  });

  // Here we expose the functions and the history
  return {
    undo,
    redo,
    history,
  };
};

// This is just a utility function for deep cloning
// Cloning the value helps us prevent reference issues
// as we're moving objects back and forth between history, source, and future
function clone(value: any) {
  return JSON.parse(JSON.stringify(value));
}
