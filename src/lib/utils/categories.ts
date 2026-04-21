/**
 * $lib/utils/categories.ts
 *
 * Flat single-level category system.
 * Slugs are stored directly on promotions.category (text column).
 * Move to a DB-driven categories table when you need icons, ordering, or i18n.
 */

export const CATEGORIES = [
  { slug: 'commerce',       label: 'Comércio'         },
  { slug: 'technology',     label: 'Tecnologia'       },
  { slug: 'vehicles',       label: 'Veículos'         },
  { slug: 'real-estate',    label: 'Imobiliário'      },
  { slug: 'health',         label: 'Saúde'            },
  { slug: 'education',      label: 'Educação'         },
  { slug: 'entertainment',  label: 'Entretenimento'   },
  { slug: 'media',          label: 'Media'            },
  { slug: 'tourism',        label: 'Turismo'          },
  { slug: 'organizations',  label: 'Organizações'     },
  { slug: 'agriculture',    label: 'Agricultura'      },
  { slug: 'government',     label: 'Governo'          },
  { slug: 'services',       label: 'Serviços'         },
] as const;

export type CategorySlug = typeof CATEGORIES[number]['slug'];

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
