import { ref, h } from 'vue';
import { Icon } from '#components';

// Composable function to manage social sharing and link copying
export function useShare() {
  const isShareModalOpen = ref(false);
  const currentUrl = ref('');
  const showLinkCopyFeedback = ref(false);

  // Open and close modal functions
  const openShareModal = () => {
    isShareModalOpen.value = true;
    currentUrl.value = window.location.href;
  };

  const closeShareModal = () => {
    isShareModalOpen.value = false;
  };

  // Function to handle sharing to specific platforms
  const shareOnSocial = (platform) => {
    const url = encodeURIComponent(currentUrl.value);
    let shareUrl = '';

    // Generate the URL for sharing based on the platform
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${url}`;
        break;
      case 'telegram':
        shareUrl = `https://telegram.me/share/url?url=${url}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  // Function to copy the current URL to the clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl.value);
      showLinkCopyFeedback.value = true;
      setTimeout(() => {
        showLinkCopyFeedback.value = false;
      }, 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Rendering logic for the share modal
  const renderShareModal = () => {
    if (!isShareModalOpen.value) return null;

    return h('div', {
      class: 'fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center',
      onClick: closeShareModal,
      'aria-labelledby': 'shareModalTitle',
      'aria-modal': 'true'
    }, [
      h('div', {
        class: 'bg-white rounded-lg shadow-xl p-6 w-full max-w-[600px] mx-4 sm:mx-auto',
        onClick: (e) => e.stopPropagation()
      }, [
        h('div', { class: 'flex items-center justify-between border-b pb-3' }, [
          h('div', { class: 'flex items-center text-blu' }, [
            h(Icon, { name: 'heroicons:share-20-solid', class: 'w-8 h-8 mr-2 text-black' }),
            h('h3', { class: 'text-2xl font-semibold text-black mt-4', id: 'shareModalTitle' }, 'Condividi l\'articolo')
          ]),
          h('button', {
            class: 'text-gray-400 hover:text-gray-500',
            onClick: closeShareModal
          }, [
            h(Icon, { name: 'heroicons:x-mark-20-solid', class: 'w-6 h-6' })
          ])
        ]),
        h('div', { class: 'mt-4' }, [
          h('p', { class: 'font-semibold mb-4' }, 'Condividi sui social'),
          h('div', { class: 'flex space-x-4 mb-4' }, [
            h('button', {
              onClick: () => shareOnSocial('facebook'),
              class: 'text-blue-600 hover:text-blue-700'
            }, [h(Icon, { name: 'mdi:facebook', class: 'w-8 h-8' })]),
            h('button', {
              onClick: () => shareOnSocial('twitter'),
              class: 'text-black hover:text-gray-700'
            }, [h(Icon, { name: 'simple-icons:x', class: 'w-8 h-8' })]),
            h('button', {
              onClick: () => shareOnSocial('linkedin'),
              class: 'text-blue-700 hover:text-blue-800'
            }, [h(Icon, { name: 'mdi:linkedin', class: 'w-8 h-8' })]),
            h('button', {
              onClick: () => shareOnSocial('whatsapp'),
              class: 'text-green-600 hover:text-green-700'
            }, [h(Icon, { name: 'mdi:whatsapp', class: 'w-8 h-8' })]),
            h('button', {
              onClick: () => shareOnSocial('telegram'),
              class: 'text-blue-500 hover:text-blue-600'
            }, [h(Icon, { name: 'mdi:telegram', class: 'w-8 h-8' })])
          ]),
          h('p', { class: 'font-semibold mb-2' }, 'URL'),
          h('div', { class: 'flex flex-col bg-gray-100 rounded p-2' }, [
            h('div', { class: 'flex items-center' }, [
              h('input', {
                type: 'text',
                value: currentUrl.value,
                readonly: true,
                class: 'bg-transparent flex-grow mr-2 focus:outline-none px-2 py-1'
              }),
              h('button', {
                onClick: copyLink,
                class: 'text-blu hover:text-celeste'
              }, [
                h(Icon, { name: 'heroicons:clipboard-document', class: 'w-6 h-6 text-black' })
              ])
            ])
          ]),
          showLinkCopyFeedback.value && h('p', { class: 'text-green-600 mt-2 text-sm ml-4' }, 'URL copiato con successo!')
        ])
      ])
    ]);
  };

  return {
    isShareModalOpen,
    currentUrl,
    showLinkCopyFeedback,
    openShareModal,
    closeShareModal,
    shareOnSocial,
    copyLink,
    renderShareModal
  };
}