import { auth } from '$lib/auth';
import { json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
  try {
    const { action, data } = await request.json();
    let result;

    switch (action) {
      case 'signupEmail':
        result = await auth.api.signUpEmail({
          body: { email: data.e, password: data.p, name: data.n },
        });
        break;

      case 'loginEmail':
        result = await auth.api.signInEmail({
          body: { email: data.e, password: data.p },
        });
        break;

      case 'signupPhone':
        // FIX: Access via the 'phoneNumber' plugin namespace
        // @ts-ignore
        result = await auth.api.phoneNumber.signUp({
          body: { phoneNumber: data.ph, password: data.p, name: data.n },
        });
        break;

      case 'loginPhone':
        // FIX: Access via the 'phoneNumber' plugin namespace
        // @ts-ignore
        result = await auth.api.phoneNumber.signIn({
          body: { phoneNumber: data.ph, password: data.p },
        });
        break;

      default:
        return json({ error: { message: 'Invalid action' } }, { status: 400 });
    }

    return json(result);
  } catch (e: any) {
    console.error('PROXY ERROR:', e);
    return json({ error: { message: e.message } }, { status: 500 });
  }
};

// import { auth } from '$lib/auth';
// import { json } from '@sveltejs/kit';

// export const POST = async ({ request }) => {
//   // This manually handles the request, bypassing the bridge's Origin issues
//   const body = await request.json();
//   const { action, data } = body;

//   try {
//     let result;
//     if (action === 'signupEmail') {
//       result = await auth.api.signUpEmail({
//         body: {
//           email: data.e,
//           password: data.p,
//           name: data.n,
//         },
//       });
//     } else if (action === 'signupPhone') {
//       // @ts-ignore - for the phone plugin
//       result = await auth.api.signUpPhoneNumber({
//         body: {
//           phoneNumber: data.ph,
//           password: data.p,
//           name: data.n,
//         },
//       });
//     }

//     return json(result);
//   } catch (e: any) {
//     return json({ error: { message: e.message } }, { status: 400 });
//   }
// };
