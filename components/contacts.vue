<template>
    <section class="py-8 px-10 mt-6 w-11/12 mx-auto rounded-2xl section-contacts flex">
        <div class="w-2/5 p-2">
            <h3 class="text-3xl font-bold mb-4">Contatti</h3>
            <p class="mb-6 w-4/5">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris suscipit nunc et velit rhoncus, sed fermentum risus feugiat. Aliquam at turpis dictum, hendrerit metus eget, lobortis est.
            </p>
            <div class="flex mt-4 w-12 h-12">
                <a href="#" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white mr-2">
                    <Icon name="uil:facebook-f" class="text-3xl" />
                </a>
                <a href="#" class="bg-white text-blu p-2 rounded-2xl transition-colors duration-300 hover:bg-verde hover:text-white">
                    <Icon name="uil:instagram" class="text-3xl" />
                </a>
            </div>
        </div>
        <div class="w-3/5 p-2">
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