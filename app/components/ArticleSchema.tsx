interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  image?: string;
  category?: string;
}

export default function ArticleSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName = 'Myncel Facility Tech Team',
  image = 'https://www.myncel.com/logo.png',
  category = 'Equipment Maintenance',
}: ArticleSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: url,
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: authorName,
      url: 'https://www.myncel.com/blog',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Myncel',
      url: 'https://www.myncel.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.myncel.com/logo.png',
      },
    },
    image: {
      '@type': 'ImageObject',
      url: image,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: category,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}