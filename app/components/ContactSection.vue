<template>
  <section id="section-contacts" class="py-8 px-4 md:px-10 mt-6 w-11/12 mx-auto rounded-2xl bg-[#f5f5f5] flex flex-col md:flex-row scroll-mt-28">
    <div class="w-full md:w-2/5 p-2">
      <h2 class="text-3xl font-bold mb-4">Contatti</h2>
      <p class="mb-6 w-full md:w-4/5">
        Per informazioni, segnalazioni o proposte di collaborazione usa il modulo: arriva direttamente alla redazione.
        Se preferisci l'email, scrivi a <a href="mailto:info@wikiherbalist.com" class="text-blu hover:text-celeste">info@wikiherbalist.com</a>.
      </p>
      <div class="flex mt-4 w-12 h-12">
        <a href="#" aria-label="Facebook" class="pointer-events-none bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white mr-2">
          <Icon name="uil:facebook-f" class="text-3xl" />
        </a>
        <a href="#" aria-label="Instagram" class="pointer-events-none bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white">
          <Icon name="uil:instagram" class="text-3xl" />
        </a>
      </div>
    </div>
    <div class="w-full md:w-3/5 p-2">
      <ContactForm />
    </div>
  </section>
</template>
