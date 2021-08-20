import { RichText } from 'prismic-dom';

interface CalcTimeReadingProps {
  content: {
    heading: string;
    body: {
      text: string;
      type: string;
      url: string;
    }[];
  }[];
}

export function calcTimeReading({ content }: CalcTimeReadingProps): number {
  const numberOfWords = content.reduce((total, p) => {
    let words = 0;

    words += RichText.asText(p.heading).split(' ').length ?? 0;
    words += RichText.asText(p.body)
      .split(' ')
      .filter(w => w.match(/^[\w, ", ', -]{2,}/g)).length;
    return total + words;
  }, 0);
  const timeReading = Math.ceil(numberOfWords / 200);

  return timeReading;
}
