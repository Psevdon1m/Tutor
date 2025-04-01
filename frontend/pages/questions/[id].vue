<template>
  <div class="p-6 max-w-3xl mx-auto">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center my-12">
      <div
        class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 p-4 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
      <button
        @click="fetchQuestion"
        class="mt-2 text-red-600 hover:text-red-800"
      >
        Try again
      </button>
    </div>

    <!-- Question detail -->
    <div
      v-else-if="question"
      class="bg-white rounded-lg shadow-md overflow-hidden"
    >
      <div class="p-6">
        <!-- Subject badge -->
        <div>
          <div class="flex justify-between items-center mb-6">
            <div
              class="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mb-4"
            >
              {{ question?.subject?.name || "Unknown Subject" }}
            </div>
            <button
              @click="goBack"
              class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clip-rule="evenodd"
                />
              </svg>
              Back
            </button>
          </div>
        </div>

        <!-- Question -->
        <h1 class="text-xl font-medium italic text-gray-900 mb-6">
          {{ question.question_text }}
        </h1>

        <!-- Answer -->
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 class="text-lg font-medium text-gray-800 mb-2">Answer:</h2>
          <div
            class="answer-content"
            v-html="parseAnswer(question.answer_text)"
          ></div>
        </div>

        <!-- Date -->
        <div class="text-sm text-gray-500">
          Added on {{ formatDate(question.created_at) }}
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else class="bg-white rounded-lg shadow-md p-8 text-center">
      <h2 class="text-xl font-medium text-gray-800 mb-2">Question not found</h2>
      <NuxtLink to="/questions" class="text-[#5e9f95] hover:underline">
        Back to Questions
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Question } from "~/types/db/question";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
// Add additional Prism components
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/plugins/normalize-whitespace/prism-normalize-whitespace";

// Configure Prism whitespace normalization
Prism.plugins.NormalizeWhitespace.setDefaults({
  "remove-trailing": true,
  "remove-indent": true,
  "left-trim": true,
  "right-trim": true,
  "break-lines": 80,
  indent: 2,
  "remove-initial-line-feed": true,
  "tabs-to-spaces": 2,
});

const route = useRoute();
const id = route.params.id as string;
const questionsStore = useQuestionsStore();
const loading = ref(true);
const error = ref<string | null>(null);
const question = ref<Question | null>(null);

const fetchQuestion = async () => {
  loading.value = true;
  error.value = null;

  try {
    const isQuestionExists = questionsStore.getQuestionById(id);
    if (isQuestionExists) {
      question.value = isQuestionExists;
    } else {
      debugger;
      const result = await questionsStore.fetchQuestionById(id);
      question.value = result;
    }
  } catch (err: any) {
    error.value =
      err instanceof Error ? err.message : "Failed to load question";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchQuestion();
  nextTick(() => {
    Prism.highlightAll();
  });
});

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const goBack = () => {
  navigateTo("/questions-list");
};

const parseAnswer = (answer: string) => {
  // First, extract all code blocks
  const codeBlocks: { language: string; code: string }[] = [];
  let text = answer.replace(
    /```(typescript|[\w]*)\s*([\s\S]*?)```/g,
    (match, lang, code) => {
      const language = lang.trim().toLowerCase() || "plaintext";
      const cleanCode = code.trim().replace(/^typescript\s+/i, "");

      // Format the code using Prism's normalize-whitespace plugin
      const formattedCode = Prism.plugins.NormalizeWhitespace.normalize(
        cleanCode,
        {
          indent: 2,
        }
      );

      codeBlocks.push({
        language,
        code: formattedCode,
      });
      return "{{CODE_BLOCK_" + (codeBlocks.length - 1) + "}}";
    }
  );

  console.log({ codeBlocks, text });

  // Process regular text and code block placeholders
  const result = [];
  const paragraphs = text.split("\n\n");

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    if (trimmedParagraph.startsWith("{{CODE_BLOCK_")) {
      // Replace code block placeholder with actual code block
      const blockIndex = parseInt(
        trimmedParagraph.match(/{{CODE_BLOCK_(\d+)}}/)?.[1] || "0"
      );
      const block = codeBlocks[blockIndex];
      if (block) {
        result.push(`
          <div class="relative my-6">
            <div class="absolute top-0 right-0 px-4 py-2 rounded-tr bg-gray-800 text-xs text-gray-400">
              ${block.language}
            </div>
            <pre class="bg-gray-800 rounded-lg p-4 overflow-x-auto"><code class="language-${block.language} text-sm">${block.code}</code></pre>
          </div>
        `);
      }
    } else if (
      trimmedParagraph.startsWith("1.") ||
      trimmedParagraph.startsWith("*") ||
      trimmedParagraph.startsWith("-")
    ) {
      // Handle lists
      const listItems = trimmedParagraph
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item)
        .map((item) => {
          const cleanItem = item.replace(/^[1-9]\.\s*|\*\s*|-\s*/, "");
          return `<li class="ml-6 list-disc text-gray-700">${cleanItem}</li>`;
        })
        .join("");
      result.push(`<ul class="my-4 space-y-2">${listItems}</ul>`);
    } else {
      // Regular paragraph
      result.push(`<p class="text-gray-700 my-4">${trimmedParagraph}</p>`);
    }
  }

  return result.join("\n");
};
</script>

<style lang="postcss">
/* Prism.js customizations */
:deep(pre[class*="language-"]) {
  margin: 0;
  padding: 1.5rem;
  background: #1f2937;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}

:deep(code[class*="language-"]) {
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
  tab-size: 2;
}

/* Enhance keyword highlighting */
:deep(.token.keyword) {
  color: #c678dd;
  font-weight: 500;
}

:deep(.token.function) {
  color: #61afef;
  font-weight: 500;
}

:deep(.token.string) {
  color: #98c379;
}

:deep(.token.comment) {
  color: #7f848e;
  font-style: italic;
}

:deep(.token.punctuation) {
  color: #abb2bf;
}

:deep(.token.operator) {
  color: #56b6c2;
}

:deep(.token.boolean) {
  color: #d19a66;
}

:deep(.token.number) {
  color: #d19a66;
}

:deep(.token.property) {
  color: #e06c75;
}

:deep(.token.parameter) {
  color: #e06c75;
}

/* Add line numbers styling if you want to enable them */
:deep(pre[class*="language-"].line-numbers) {
  position: relative;
  padding-left: 3.8em;
  counter-reset: linenumber;
}
</style>
