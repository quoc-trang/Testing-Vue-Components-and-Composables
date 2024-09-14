import { describe, it, expect, beforeEach } from "vitest";
import { useRefHistory } from "../src/composables/useRefHistory";
import { ref, nextTick } from "vue";

describe("useRefHistory", () => {
  it("stores the history of the source value", async () => {
    const source = ref(1);
    const { history } = useRefHistory(source);

    expect(history.value.length).toBe(0);

    source.value = 2;
    await nextTick();
    expect(history.value.at(0)?.value).toBe(1);

    source.value = 3;
    await nextTick();
    expect(history.value.at(0)?.value).toBe(2);
  });

  it("does NOT include the current value in history", async () => {
    const source = ref(0);
    const { history } = useRefHistory(source);

    source.value = 1;
    await nextTick();

    expect(history.value.at(0)?.value).toBe(0);
  });

  it("stores the history ordered from newest to oldest", async () => {
    const source = ref(0);
    const { history } = useRefHistory(source);
    for (let index = 0; index < 10; index++) {
      source.value = index;
      await nextTick();
    }

    expect(history.value.at(0)?.value).toBe(8);
    expect(history.value.at(history.value.length - 1)?.value).toBe(0);
  });

  it("removes the oldest record(s) when the history reaches the capacity", async () => {
    const source = ref(0);
    const cap = 4;
    const { history } = useRefHistory(source, cap);

    for (let i = 1; i <= cap; i++) {
      source.value = i;
      await nextTick();
    }

    expect(history.value.at(-1)?.value).toBe(0);

    source.value = 100;
    await nextTick();

    expect(history.value.at(-1)?.value).toBe(1);
  });

  it("allows capacity as a getter (callback function) and dynamically update history when capacity changes", async () => {
    const source = ref(0);
    const cap = ref(4);
    const { history } = useRefHistory(source, () => cap.value);

    for (let i = 1; i <= cap.value; i++) {
      source.value = i;
      await nextTick();
    }

    expect(history.value.length).toBe(4);

    cap.value = 2;
    await nextTick();
    expect(history.value.length).toBe(2);
  });

  it("allows capacity as a ref and dynamically update history when capacity changes", async () => {
    const source = ref(0);
    const cap = ref(4);
    const { history } = useRefHistory(source, cap);

    for (let i = 1; i <= cap.value; i++) {
      source.value = i;
      await nextTick();
    }

    expect(history.value.length).toBe(4);

    cap.value = 2;
    await nextTick();
    expect(history.value.length).toBe(2);
  });

  it("sets the data source back to the previous value on undo", async () => {
    const source = ref(0);
    const cap = ref(4);
    const { history, undo } = useRefHistory(source, () => cap.value);

    for (let i = 0; i < cap.value; i++) {
      source.value = i;
      await nextTick();
    }

    expect(source.value).toBe(3);
    undo();
    await nextTick();

    expect(source.value).toBe(2);
  });

  it("sets the data source to one record forward in history on redo", async () => {
    const source = ref(0);
    const cap = ref(4);
    const { history, undo, redo } = useRefHistory(source, () => cap.value);

    for (let i = 0; i < cap.value; i++) {
      source.value = i;
      await nextTick();
    }

    expect(source.value).toBe(3);
    undo();
    await nextTick();

    expect(source.value).toBe(2);

    redo();
    await nextTick();

    expect(source.value).toBe(3);
  });
});
