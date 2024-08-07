import { ref, computed, h } from 'vue';
import { useNuxtApp } from '#app';

// Composable function to manage citations with dynamic styles and modal control
export function useCite(initialTitle, initialAuthorName, initialPublishDate) {
  const nuxtApp = useNuxtApp();
  
  // Setup initial state with default values
  const title = ref(initialTitle || 'Titolo non disponibile');
  const authorName = ref(initialAuthorName || 'Editors of Wikiherbalist');
  const publishDate = ref(initialPublishDate || new Date().toISOString());

  // State for modal visibility and citation formatting
  const isCiteModalOpen = ref(false);
  const selectedCitationStyle = ref('MLA'); // Default citation style
  const showCitationCopyFeedback = ref(false);

  const openCiteModal = () => {
    isCiteModalOpen.value = true;
  };

  const closeCiteModal = () => {
    isCiteModalOpen.value = false;
  };

  // Function to generate citation text based on selected style
  const generateCitation = () => {
    const author = authorName.value === 'wh_admin' ? 'Editors of Wikiherbalist' : authorName.value;
    const date = new Date(publishDate.value);
    const url = process.client ? window.location.href : 'https://wikiherbalist.com';
    const accessDate = new Date();

    const formattedTitle = title.value || 'Titolo non disponibile';

    switch (selectedCitationStyle.value) {
      case 'MLA':
        return `${author}. "${formattedTitle}." Wikiherbalist, ${date.getDate()} ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}, ${url}. Accessed ${accessDate.getDate()} ${accessDate.toLocaleString('en-US', { month: 'long' })} ${accessDate.getFullYear()}.`;
      case 'APA':
        return `${author}. (${date.getFullYear()}, ${date.toLocaleString('en-US', { month: 'long' })} ${date.getDate()}). ${formattedTitle}. Wikiherbalist. ${url}`;
      case 'Wikipedia':
        return `{{cite web |title=${formattedTitle} |url=${url} |website=Wikiherbalist |author=${author} |date=${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} |access-date=${accessDate.toISOString().split('T')[0]}}}`;
      default:
        return 'Select a citation style';
    }
  };

  const citationParts = computed(() => {
    const citation = generateCitation();
    let parts = [];

    if (selectedCitationStyle.value === 'MLA') {
      const regex = new RegExp(`(${title.value}|Wikiherbalist)`, 'g');
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(citation)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ text: citation.slice(lastIndex, match.index), italic: false });
        }
        parts.push({ text: match[0], italic: true });
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < citation.length) {
        parts.push({ text: citation.slice(lastIndex), italic: false });
      }
    } else if (selectedCitationStyle.value === 'APA') {
      const titleIndex = citation.indexOf(title.value);
      if (titleIndex !== -1) {
        parts.push({ text: citation.slice(0, titleIndex), italic: false });
        parts.push({ text: title.value, italic: true });
        parts.push({ text: citation.slice(titleIndex + title.value.length), italic: false });
      } else {
        parts.push({ text: citation, italic: false });
      }
    } else {
      parts.push({ text: citation, italic: false });
    }

    return parts;
  });

  const copyCitation = async () => {
    try {
      const plainTextCitation = generateCitation();
      await navigator.clipboard.writeText(plainTextCitation);
      showCitationCopyFeedback.value = true;
      setTimeout(() => {
        showCitationCopyFeedback.value = false;
      }, 3000);
    } catch (err) {
      console.error('Failed to copy citation:', err);
    }
  };

  const renderCiteModal = () => {
    if (!isCiteModalOpen.value) return null;

    return h('div', {
      class: 'fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center',
      onClick: closeCiteModal,
      role: 'dialog',
    'aria-labelledby': 'citeModalTitle'
    }, [
      h('div', {
        class: 'bg-white rounded-lg shadow-xl p-6 w-full max-w-[600px] mx-4 sm:mx-auto',
        onClick: (e) => e.stopPropagation(),
        'aria-modal': 'true'
      }, [
        h('div', { class: 'flex items-center justify-between border-b pb-3' }, [
          h('div', { class: 'flex items-center text-blu' }, [
            h(nuxtApp.vueApp.component('Icon'), { name: 'bi:quote', class: 'text-xl md:text-3xl text-black mr-2' }),
            h('h3', { class: 'text-2xl font-semibold text-black mt-4', id: 'citeModalTitle' }, 'Cita l\'articolo')
          ]),
          h('button', {
            class: 'text-gray-400 hover:text-gray-500',
            onClick: closeCiteModal
          }, [
            h(nuxtApp.vueApp.component('Icon'), { name: 'heroicons:x-mark-20-solid', class: 'w-6 h-6' })
          ])
        ]),
        h('div', { class: 'mt-4' }, [
          h('p', { class: 'text-sm text-gray-600 mb-4' }, 'Nonostante sia stato fatto il possibile per seguire le regole dello stile di citazione, potrebbero esserci alcune discrepanze. In caso di domande, si prega di consultare il manuale di stile appropriato o altre fonti.'),
          h('label', { 
            for: 'citation-style',
            class: 'block text-sm font-medium text-gray-700 mb-2'
          }, 'Seleziona formato di citazione:'),
          h('select', {
            id: 'citation-style',
            value: selectedCitationStyle.value,
            onChange: (e) => selectedCitationStyle.value = e.target.value,
            class: 'w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 mb-4 px-3 py-2'
          }, [
            h('option', { value: 'MLA' }, 'MLA 9th edition'),
            h('option', { value: 'APA' }, 'APA 7th edition'),
            h('option', { value: 'Wikipedia' }, 'Wikipedia')
          ]),
          h('div', { class: 'mt-4 p-3 bg-gray-100 rounded-md' }, [
            h('div', { class: 'relative' }, [
              h('p', { class: 'text-sm pr-8' }, [
                ...citationParts.value.map(part => 
                  h('span', { class: part.italic ? 'italic' : '' }, part.text)
                )
              ]),
              h('button', {
                onClick: copyCitation,
                class: 'absolute top-0 right-0 text-blu hover:text-celeste'
              }, [
                h(nuxtApp.vueApp.component('Icon'), { name: 'heroicons:clipboard-document', class: 'w-6 h-6 text-black' })
              ])
            ])
          ]),
          showCitationCopyFeedback.value && h('p', { class: 'text-green-600 mt-2 text-sm ml-4' }, 'Citazione copiata negli appunti!')
        ])
      ])
    ]);
  };

  return {
    isCiteModalOpen,
    selectedCitationStyle,
    showCitationCopyFeedback,
    citationParts,
    openCiteModal,
    closeCiteModal,
    copyCitation,
    renderCiteModal,
    updateTitle: (newTitle) => { title.value = newTitle || 'Titolo non disponibile'; },
    updateAuthorName: (newAuthorName) => { authorName.value = newAuthorName || 'Editors of Wikiherbalist'; },
    updatePublishDate: (newPublishDate) => { publishDate.value = newPublishDate || new Date().toISOString(); }
  };
}