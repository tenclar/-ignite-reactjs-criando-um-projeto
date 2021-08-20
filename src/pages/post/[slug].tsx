import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { calcTimeReading } from '../../utils/CalcTimeReading';

interface Post {
  slug: string;
  timeReading:string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  return (
    <>
      <Head>
        <title> SpaceTraveling. - Posts </title>
      </Head>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
      </div>
      <div className={commonStyles.container}>
        <h1>{post.data.title}</h1>

        <div className={styles.info}>
          <time>
            <FiCalendar size={20} />
            {post.first_publication_date}
          </time>
          <span>
            <FiUser size={20} />
            {post.data.author}
          </span>
          <span>
            <FiClock size={20} />
            {post.timeReading} min
          </span>
        </div>

        {post.data.content.map(content =>
           (
            <article key={`${content.heading}${Math.random()}`}>
              <h2>{RichText.asText(content.heading)}</h2>
              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          )
        )}
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);
  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const timeReading = calcTimeReading(response.data)

  const prevPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date]',
    }
  );

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const post = {
    slug,
    timeReading,
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      { locale: ptBR }
    ),
    data: {
      title: RichText.asText(response.data.title),
      subtitle: RichText.asText(response.data.subtitle),
      banner: response.data.banner,
      author: RichText.asText(response.data.author),
      content: response.data.content,
    },

  };

  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
      preview,
    },
    revalidate: 60 * 60 * 12,
  };
};
