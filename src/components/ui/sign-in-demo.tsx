import React from 'react';
import { SignInPage, type Testimonial } from '@/components/ui/sign-in';

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: '/logo.png',
    name: 'Bu Ayu',
    handle: 'Verifikator & Finance',
    text: 'Verifikasi kelengkapan Memo IAM, pajak PPN/PPh, dan penerbitan Payment Voucher terintegrasi dalam satu alur.',
  },
  {
    avatarSrc: '/logo.png',
    name: 'Pak Hery & Koji Hashimoto',
    handle: 'Board of Directors (BoD)',
    text: 'Otorisasi direksi paralel dengan jejak audit transparan dan ringkasan anggaran per cabang.',
  },
  {
    avatarSrc: '/logo.png',
    name: 'Cabang & Pemohon',
    handle: 'Staff Operasional',
    text: 'Beranda Caready memudahkan inisiasi PR, PO, AV, RB, dan pertanggungjawaban RC secara mandiri.',
  },
];

export const SignInPageDemo = () => {
  return (
    <SignInPage
      heroImageSrc="/logo.png"
      testimonials={sampleTestimonials}
    />
  );
};

export default SignInPageDemo;
