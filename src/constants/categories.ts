export interface DefaultCategory {
  id: string;
  name: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: 'cat_gaming', name: 'Gaming', icon: 'game-controller-outline' },
  { id: 'cat_email', name: 'Email', icon: 'mail-outline' },
  { id: 'cat_social', name: 'Social Media', icon: 'share-social-outline' },
  { id: 'cat_finance', name: 'Finance', icon: 'wallet-outline' },
  { id: 'cat_work', name: 'Work', icon: 'briefcase-outline' },
  { id: 'cat_shopping', name: 'Shopping', icon: 'cart-outline' },
  { id: 'cat_education', name: 'Education', icon: 'school-outline' },
  { id: 'cat_others', name: 'Others', icon: 'grid-outline' },
];
