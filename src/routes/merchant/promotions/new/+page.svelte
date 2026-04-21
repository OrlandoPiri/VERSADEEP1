<script lang="ts">
  import MerchantPromotionForm from '$lib/components/MerchantPromotionForm.svelte';
 import {goto} from '$app/navigation';

 import { page } from '$app/state';

$effect(() => {
    // Allow any authenticated user — merchant, admin, and regular users
    if (!page.data.user) {
      goto('/auth/login');
    }
 //if (!page.data.user || (page.data.user.role !== 'merchant' && page.data.user.role !== 'admin')) {
  //  goto('/auth/login');
 // } 
});

</script>

<MerchantPromotionForm />




