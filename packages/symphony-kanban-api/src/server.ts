import { app } from "./app.js";
import { ensureBuiltinTags } from "./builtin-tags.js";

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
try {
  ensureBuiltinTags();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error("Failed to ensure builtin tags", error);
}
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on :${port}`);
});
