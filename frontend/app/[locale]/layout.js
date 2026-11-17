import { getMessages, LOCALES } from '@/lib/getMessages';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SetHtmlAttrs from '@/components/SetHtmlAttrs';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }) {
  const messages = getMessages(params.locale);
  return {
    title: messages.meta.defaultTitle,
    description: messages.meta.defaultDescription
  };
}

export default function LocaleLayout({ children, params }) {
  const { locale } = params;
  const messages = getMessages(locale);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <>
      <SetHtmlAttrs lang={locale} dir={dir} />
      <div dir={dir}>
        <Header locale={locale} messages={messages} />
        <main>{children}</main>
        <Footer locale={locale} messages={messages} />
      </div>
    </>
  );
}

