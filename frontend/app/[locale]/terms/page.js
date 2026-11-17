import { getMessages } from '@/lib/getMessages';

const CONTENT = {
  en: {
    updated: 'July 2026',
    sections: [
      {
        heading: 'Appointments',
        body: 'Booking an appointment through this website reserves a time slot at the selected clinic location. Appointments are auto-confirmed on booking. Please arrive on time; late arrival may require rescheduling depending on clinic availability.'
      },
      {
        heading: 'Cancellations and rescheduling',
        body: 'You may reschedule or cancel your appointment at any time using the link sent in your confirmation email, at no charge, up until your scheduled time.'
      },
      {
        heading: 'Deposits',
        body: 'Certain services may require a deposit, collected securely via our payment provider at the time of booking. Deposit refund policy for cancellations will be communicated at the time of booking where applicable.'
      },
      {
        heading: 'Medical disclaimer',
        body: 'Information on this website is provided for general informational purposes only and does not constitute medical advice. Always consult a qualified healthcare provider regarding any medical condition or treatment.'
      },
      {
        heading: 'Website use',
        body: 'This website and its content are provided "as is." We reserve the right to update these terms, our services, and our content at any time.'
      }
    ],
    disclaimer: 'This is a template terms of service document. It should be reviewed by qualified legal counsel before publishing, and adapted to reflect the clinic\u2019s actual policies and applicable law in Egypt and the UAE.'
  },
  ar: {
    updated: 'يوليو 2026',
    sections: [
      {
        heading: 'المواعيد',
        body: 'حجز موعد عبر هذا الموقع يحجز لك وقتًا محددًا في فرع العيادة المختار. تُؤكَّد المواعيد تلقائيًا عند الحجز. يرجى الحضور في الوقت المحدد؛ فقد يتطلب التأخر إعادة جدولة الموعد بحسب توفر المواعيد.'
      },
      {
        heading: 'الإلغاء وإعادة الجدولة',
        body: 'يمكنك إعادة جدولة موعدك أو إلغاؤه في أي وقت باستخدام الرابط المرسل في رسالة التأكيد عبر البريد الإلكتروني، دون أي رسوم، حتى موعدك المحدد.'
      },
      {
        heading: 'العربون',
        body: 'قد تتطلب بعض الخدمات دفع عربون، يتم تحصيله بشكل آمن عبر مزود خدمة الدفع لدينا وقت الحجز. سيتم توضيح سياسة استرداد العربون عند الإلغاء وقت الحجز، عند انطباقها.'
      },
      {
        heading: 'إخلاء المسؤولية الطبية',
        body: 'المعلومات الواردة في هذا الموقع مقدمة لأغراض عامة فقط ولا تُعد استشارة طبية. يُرجى دائمًا استشارة مقدم رعاية صحية مؤهل بخصوص أي حالة طبية أو علاج.'
      },
      {
        heading: 'استخدام الموقع',
        body: 'يُقدَّم هذا الموقع ومحتواه "كما هو". نحتفظ بالحق في تحديث هذه الشروط وخدماتنا ومحتوانا في أي وقت.'
      }
    ],
    disclaimer: 'هذه وثيقة شروط خدمة نموذجية. يجب مراجعتها من قِبل مستشار قانوني مختص قبل نشرها، وتكييفها لتعكس السياسات الفعلية للعيادة والقوانين المعمول بها في مصر والإمارات.'
  }
};

export default function TermsPage({ params }) {
  const { locale } = params;
  const t = getMessages(locale);
  const c = CONTENT[locale] || CONTENT.en;

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 md:px-8">
      <h1 className="font-display text-3xl font-semibold text-clinic-dark">{t.legal.termsTitle}</h1>
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
