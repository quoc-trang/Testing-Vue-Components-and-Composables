<script setup lang="ts">
import { ref } from "vue";
import { useTheme, useRefHistory } from "./composables";

const theme = useTheme("light");
const capacity = ref(10);

const { undo, redo, history } = useRefHistory(theme, capacity);
</script>
<template>
  <div class="page">
    <div class="container">
      <h1>Hello useRefHistory Composable</h1>
      <p>
        Current Source Value: <strong>{{ theme }}</strong>
      </p>
      <div class="btn-container">
        <button class="btn btn-primary shrink" @click="undo">Undo</button>
        <button class="btn btn-secondary shrink" @click="redo">Redo</button>
        <label>
          Capacity
          <input type="number" v-model="capacity" min="1" />
        </label>
      </div>

      <label class="form-control">
        <select v-model="theme">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="coffee">Coffee</option>
          <option value="cupcake">Cupcake</option>
        </select>
      </label>

      <div class="mockup-code">
        <pre>// History (Length: {{ history.length }})</pre>
        <pre>{{ history }}</pre>
      </div>
    </div>
  </div>
</template>
