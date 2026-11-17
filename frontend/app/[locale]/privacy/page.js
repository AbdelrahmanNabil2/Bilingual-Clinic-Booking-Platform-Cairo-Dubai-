import { getMessages } from '@/lib/getMessages';

const CONTENT = {
  en: {
    updated: 'July 2026',
    sections: [
      {
        heading: 'What we collect',
        body: 'When you contact us, book an appointment, subscribe to our newsletter, or submit a review, we collect the information you provide directly: your name, email address, phone number, and any message or notes you include. When you book an appointment, we also store the date, time, and clinic location you selected.'
      },
      {
        heading: 'How we use it',
        body: 'We use this information to schedule and manage appointments, respond to enquiries, send appointment confirmations and reminders, and — only if you subscribe — send occasional newsletter updates. We do not sell your information to third parties.'
      },
      {
        heading: 'Email and SMS providers',
        body: 'To deliver confirmations and reminders, we may share your email address or phone number with our email delivery provider and, where enabled, an SMS/WhatsApp provider, solely for the purpose of sending you those messages.'
      },
      {
        heading: 'Payment information',
        body: 'If a deposit is required for a booking, payment is processed by our payment provider (Stripe). We do not store your card details on our own servers.'
      },
      {
        heading: 'Data retention',
        body: 'We retain appointment and contact records for as long as necessary to provide our services and meet our record-keeping obligations. You may request that we delete your information by contacting us directly, subject to any legal retention requirements.'
      },
      {
        heading: 'Your rights',
        body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us using the details on our Contact page.'
      }
    ],
    disclaimer: 'This is a template privacy policy. It should be reviewed by qualified legal counsel familiar with applicable data protection law (including Egypt\u2019s Personal Data Protection Law and the UAE\u2019s data protection regulations) before publishing, since it currently omits jurisdiction-specific requirements.'
  },
  ar: {
    updated: 'يوليو 2026',
    sections: [
      {
        heading: 'ما الذي نجمعه',
        body: 'عندما تتواصل معنا، أو تحجز موعدًا، أو تشترك في نشرتنا الإخبارية، أو ترسل مراجعة، نقوم بجمع المعلومات التي تقدمها مباشرة: اسمك، بريدك الإلكتروني، رقم هاتفك، وأي رسالة أو ملاحظات ترفقها. عند حجز موعد، نحتفظ أيضًا بالتاريخ والوقت وفرع العيادة الذي اخترته.'
      },
      {
        heading: 'كيف نستخدمها',
        body: 'نستخدم هذه المعلومات لجدولة المواعيد وإدارتها، والرد على الاستفسارات، وإرسال تأكيدات وتذكيرات المواعيد، وفقط في حال اشتراكك، إرسال تحديثات دورية عبر النشرة الإخبارية. نحن لا نبيع معلوماتك لأطراف ثالثة.'
      },
      {
        heading: 'مزودو البريد الإلكتروني والرسائل النصية',
        body: 'لإرسال التأكيدات والتذكيرات، قد نشارك بريدك الإلكتروني أو رقم هاتفك مع مزود خدمة البريد الإلكتروني، وعند التفعيل، مزود خدمة الرسائل النصية أو واتساب، وذلك فقط لغرض إرسال هذه الرسائل.'
      },
      {
        heading: 'معلومات الدفع',
        body: 'في حال طُلب عربون لتأكيد الحجز، تتم معالجة الدفع من خلال مزود خدمة الدفع (Stripe). نحن لا نخزن بيانات بطاقتك على خوادمنا.'
      },
      {
        heading: 'الاحتفاظ بالبيانات',
        body: 'نحتفظ بسجلات المواعيد والتواصل للمدة اللازمة لتقديم خدماتنا والوفاء بالتزاماتنا. يمكنك طلب حذف معلوماتك بالتواصل معنا مباشرة، وفقًا لأي متطلبات احتفاظ قانونية.'
      },
      {
        heading: 'حقوقك',
        body: 'يمكنك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها في أي وقت من خلال التواصل معنا عبر التفاصيل الموجودة في صفحة التواصل.'
      }
    ],
    disclaimer: 'هذه سياسة خصوصية نموذجية. يجب مراجعتها من قِبل مستشار قانوني مختص بقوانين حماية البيانات المعمول بها (بما في ذلك قانون حماية البيانات الشخصية المصري ولوائح حماية البيانات الإماراتية) قبل نشرها، حيث إنها لا تشمل حاليًا المتطلبات الخاصة بكل نطاق قضائي.'
  }
};

export default function PrivacyPage({ params }) {
  const { locale } = params;
  const t = getMessages(locale);
  const c = CONTENT[locale] || CONTENT.en;

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 md:px-8">
      <h1 className="font-display text-3xl font-semibold text-clinic-dark">{t.legal.privacyTitle}</h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-ink/40">{t.legal.lastUpdated}: {c.updated}</p>

      <div className="mt-10 space-y-8">
        {c.sections.map((s) => (
          <div key={s.heading}>
            <h2 className="font-display text-lg font-semibold text-clinic-dark">{s.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 rounded-xl border border-gold/30 bg-sand/60 p-4 text-xs leading-relaxed text-ink/60">
        {c.disclaimer}
      </p>
    </div>
  );
}
