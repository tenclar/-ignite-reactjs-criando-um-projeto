import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState, useEffect } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  first_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
    const formattedPost = postsPagination.results.map(post => {
    return {
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }),
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }
  });

  const [posts, setPosts] = useState<Post[]>(formattedPost);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);


  /* function handleNextPage(): void {
    fetch(nextPage)
      .then(res => res.json())
      .then(data => {
        const newPost = data.results.map(post => {
          return {
            slug: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setPosts([...posts, ...newPost]);
        setNextPage(data.next_page);
      });
  } */

  async function loadMorePostsButton(): Promise<void> {
    if(nextPage === null){
      return;
    }
   const postResults = await fetch(`${nextPage}`).then(res=> res.json());
   setNextPage(postResults.next_page);
    const newPosts = postResults.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
      }
    });
    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title> SpaceTraveling. </title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.postList}>
          {posts.map(post => (
            <Link  href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <sub>{post.data.subtitle}</sub>
                <div className={styles.info}>
                  <time>
                    <FiCalendar size={20} />
                    {post.first_publication_date}
                  </time>
                  <span>
                    <FiUser size={20} />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}



          {nextPage && (
            <button  type="button" onClick={loadMorePostsButton} className={styles.buttonPosts} >
              Carregar mais posts
            </button>
          )}


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
      pageSize: 1,
    }
  );
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date:
        post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });
const postsPagination ={
  next_page: postsResponse.next_page,
  results: posts,
}
  // console.log(JSON.stringify(postsResponse, null, 2));
  return {
    props: {
      postsPagination,
    },

  };
};
