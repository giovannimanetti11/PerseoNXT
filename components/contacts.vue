<template>
    <!-- Section for contact information and social media links -->
    <section id="section-contacts" class="py-8 px-4 md:px-10 mt-6 w-11/12 mx-auto rounded-2xl section-contacts flex flex-col md:flex-row">
        <!-- Contact information area -->
        <div class="w-full md:w-2/5 p-2">
            <h3 class="text-3xl font-bold mb-4">Contatti</h3>
            <p class="mb-6 w-full md:w-4/5">
                Per qualsiasi informazione o richiesta di collaborazione compilare il modulo a fianco.
                Ogni comunicazione sarà trattata con la massima attenzione, garantendo una risposta tempestiva.
            </p>
            <!-- Social media icons -->
            <div class="flex mt-4 w-12 h-12">
                <a href="#" aria-label="Facebook" class="pointer-events-none bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white mr-2">
                    <Icon name="uil:facebook-f" class="text-3xl" />
                </a>
                <a href="#" aria-label="Instagram" class="pointer-events-none bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white">
                    <Icon name="uil:instagram" class="text-3xl" />
                </a>
            </div>
        </div>
        <!-- Embedding ContactForm component -->
        <div class="w-full md:w-3/5 p-2">
            <ContactForm />
        </div>
    </section>
</template>

<script setup>
    import ContactForm from "./contactform.vue";
</script>

<style scoped>
    .section-contacts {
        background: #f5f5f5;
    }
</style>