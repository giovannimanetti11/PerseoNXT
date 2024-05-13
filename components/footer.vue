<template>
    <div class="footer-section flex grid grid-cols-12 gap-x-4 bg-ghiaccio text-black mt-6 py-14 w-11/12 m-auto rounded-2xl">
        <!-- Left col -->
        <div class="col-start-1 col-span-3 flex flex-col ml-6">
            <a href="https://wikinutritionals.com" class="flex flex-col m-auto text-center">
                <img  src="/media/logo_wikiherbalist.svg" alt="WikiHerbalist Logo" class="h-auto w-full mb-4">
                <p class="mt-4 text-lg font-semibold text-center">Supporta la nostra attività di divulgazione</p>
                <button class="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-white hover:text-red-500 transition duration-300">
                    <Icon name="ph:heart" class="text-3xl" />
                    Donazione
                </button>
            </a>
        </div>
        <!-- Right col -->
        <div class="col-start-4 col-span-7 grid grid-cols-3 gap-x-4 content-center justify-center justify-items-center text-center">
            <div class="flex flex-col space-y-2 text-left">
                <a href="#" class="hover:underline">Glossario</a>
                <a href="#" class="hover:underline">Newsletter</a>
                <a href="#" class="hover:underline">Contattaci</a>
                
            </div>
            <div class="flex flex-col space-y-2 text-left">
                <a href="#" class="hover:underline">Lavora con Noi</a>
                <a href="#" class="hover:underline">Prossimi Eventi</a>
                <a href="#" class="hover:underline">Blog</a>
                
                
            </div>
            <div class="flex flex-col space-y-2 text-left">
                <a href="#" class="hover:underline">About</a>
                <a href="#" class="hover:underline">Privacy Policy</a>
                <a href="#" class="hover:underline">Cookie Policy</a>
            </div>
        </div>
        <!-- Social icons -->
        <div class="col-start-12 col-span-2 flex justify-end items-start w-12 h-12">
            <a href="#" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white mr-2">
                <Icon name="uil:facebook-f" class="text-3xl" />
            </a>
            <a href="#" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white">
                <Icon name="uil:instagram" class="text-3xl" />
            </a>
        </div>
    </div>
    <div class="flex flex-row justify-between items-center text-base text-black text-center m-auto px-14 py-2 w-11/12">
        <div class="text-sm mt-1.5">
            © Wikiherbalist - all rights reserved - 2024
        </div>
        <div class="text-sm mt-1.5">
            In sviluppo con <Icon name="logos:nuxt-icon" style="vertical-align: middle;" size="1.5em" />&nbsp;
            <a href="https://nuxt.com/" class="hover:cursor-pointer hover:text-celeste text-verde">Nuxt 3</a> &nbsp;<Icon name="emojione:red-heart" style="vertical-align: middle;" size="1.5em" />
        </div>
    </div>
</template>

<style scoped>
.footer-section {
    position: relative;
}
</style>
