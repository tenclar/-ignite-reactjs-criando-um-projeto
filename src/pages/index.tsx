import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  first_publication_date: string | null;
  slug: string;
  title: string;
  subtitle: string;
  author: string;
}

interface PostPagination {
  next_page: string;
  results: Post[];
  posts: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ posts }: PostPagination) {
  return (
    <>
      <Head>
        <title> SpaceTraveling. </title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.postList}>
          {posts.map(post => (
            <Link href={`/post/${post.slug}`}>
              <a key={post.slug}>
                <strong>{post.title}</strong>
                <sub>{post.subtitle}</sub>
                <div className={styles.info}>
                  <time>
                    <FiCalendar size={20} />
                    {post.first_publication_date}
                  </time>
                  <span>
                    <FiUser size={20} />
                    {post.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}
          <a className={styles.buttonPosts} type="button">
            Carregar Mais Posts
          </a>
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 100,
    }
  );
  const posts = postsResponse.results.map(post => {
    return {
      slug: post.uid,
      title: RichText.asText(post.data.title),
      subtitle: RichText.asText(post.data.subtitle),
      author: RichText.asText(post.data.author),
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });

  console.log(JSON.stringify(postsResponse, null, 2));
  return {
    props: { posts },
  };
};
