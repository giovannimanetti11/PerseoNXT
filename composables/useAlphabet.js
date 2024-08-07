import { ref, computed } from 'vue';

// Composable function to manage alphabet selection and scrolling
export function useAlphabet() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const selectedLetter = ref('A');
  const alphabetContainer = ref(null);

  // Set the currently selected letter
  const setSelectedLetter = (letter) => {
    selectedLetter.value = letter;
  };

  // Scroll the alphabet list left or right
  const scrollAlphabet = (direction) => {
    if (alphabetContainer.value) {
      alphabetContainer.value.scrollLeft += direction === 'left' ? -100 : 100;
    }
  };

  // Compute CSS classes for each letter based on selection
  const letterClass = computed(() => (letter) => [
    'px-4 py-2 rounded-full mx-1 whitespace-nowrap',
    letter === selectedLetter.value ? 'bg-celeste text-white' : 'text-black font-bold hover:bg-celeste hover:text-white',
    'role="button"',
    `aria-selected="${letter === selectedLetter.value}"`
  ]);

  return {
    alphabet,
    selectedLetter,
    alphabetContainer,
    setSelectedLetter,
    scrollAlphabet,
    letterClass
  };
}