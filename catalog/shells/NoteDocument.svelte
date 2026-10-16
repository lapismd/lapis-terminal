<script lang="ts">
  let {
    title = "README.md",
    note = false,
  }: { title?: string; note?: boolean } = $props();
</script>

<article class="shell-document">
  <p class="shell-kicker">
    {note ? "PROJECT NOTES / DEVELOPMENT" : "LAPIS TERMINAL / MAIN"}
  </p>
  <h1>{note ? "A quieter place to build" : title}</h1>
  <p class="shell-lead">
    {note
      ? "Keep your notes open while the terminal runs below."
      : "A terminal that belongs in your application."}
  </p>
  <h2>{note ? "Today’s focus" : "Getting started"}</h2>
  <p>
    {note
      ? "Explore the shell examples, try a command, then return to your notes. Rearranging the workspace keeps the session alive."
      : "Native sessions and a flexible viewport, ready to compose with the tools you already use."}
  </p>
  <pre><code
      >{note
        ? "1. Review the layout\n2. Run the checks\n3. Capture what you learned"
        : "pnpm install\npnpm test\npnpm storybook"}</code
    ></pre>
  <h2>{note ? "Working notes" : "Made to fit"}</h2>
  <p>
    {note
      ? "The terminal lives in the bottom panel. Resize or hide it whenever you need more room for your notes."
      : "The document stays above the terminal dock. Hide it for more reading space, or maximize it while a command is running."}
  </p>
</article>
