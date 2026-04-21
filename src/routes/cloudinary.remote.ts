import { query, getRequestEvent } from '$app/server'; // Grab getRequestEvent here
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * We use "unchecked" with a single-argument function.
 * We pull the event context manually to satisfy the RPC's type constraints.
 */
export const getUploadSignature = query(
  "unchecked", 
  async (_input: any) => {
    // Manually retrieve the event context
    const event = getRequestEvent();

    if (!event) {
      error(500, 'Internal Server Error: Missing Request Event');
    }

    const user = event.locals.user;

    if (!user || (user.role !== 'merchant' && user.role !== 'admin')) {
      error(401, 'Utilizador não autorizado');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const params = { 
      timestamp,
      folder: 'promotions' 
    };

    const signature = (cloudinary.utils as any).api_sign_request(
      params,
      env.CLOUDINARY_API_SECRET as string,
    );

    return {
      signature,
      timestamp,
      apiKey: env.CLOUDINARY_API_KEY as string,
      cloudName: env.CLOUDINARY_CLOUD_NAME as string,
    };
  }
);

// import { query } from '$app/server';
// import { error } from '@sveltejs/kit';
// import { env } from '$env/dynamic/private';
// import { v2 as cloudinary } from 'cloudinary';

// cloudinary.config({
//   cloud_name: env.CLOUDINARY_CLOUD_NAME,
//   api_key: env.CLOUDINARY_API_KEY,
//   api_secret: env.CLOUDINARY_API_SECRET,
// });

// interface User {
//   role: 'merchant' | 'admin' | string;
// }

// interface Event {
//   locals: {
//     user?: User;
//   };
// }

// interface UploadSignatureResponse {
//   signature: string;
//   timestamp: number;
//   apiKey: string;
//   cloudName: string;
// }

// export const getUploadSignature = query(
//   async (event: Event): Promise<UploadSignatureResponse> => {
//     const user = event.locals.user;
//     if (!user || (user.role !== 'merchant' && user.role !== 'admin')) {
//       error(401, 'Unauthorized');
//     }

//     const timestamp = Math.round(Date.now() / 1000);
//     const params = { timestamp };
//     const signature = cloudinary.utils.api_sign_request(
//       params,
//       env.CLOUDINARY_API_SECRET,
//     );

//     return {
//       signature,
//       timestamp,
//       apiKey: env.CLOUDINARY_API_KEY,
//       cloudName: env.CLOUDINARY_CLOUD_NAME,
//     };
//   },
// );
