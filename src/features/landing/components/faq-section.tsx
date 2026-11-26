import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import styles from "./landing-page.module.css";

const questions = [
  {
    id: "client-app",
    question: "Do my clients need to install an app?",
    answer: "Clients can contact your business through WhatsApp. Your team manages appointments in Takodu.",
  },
  {
    id: "manual-clients",
    question: "Can I add clients who don’t use WhatsApp?",
    answer: "Yes. You can add a client manually and keep their details without a WhatsApp conversation.",
  },
  {
    id: "service-categories",
    question: "Can a service belong to more than one category?",
    answer: "Each service belongs to one category. You can move it if you decide to organize your catalog differently.",
  },
  {
    id: "mobile",
    question: "Is Takodu a mobile app?",
    answer: "Takodu is a web app you open in your browser.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className={styles.faq} aria-labelledby="faq-title">
      <div>
        <p className={styles.eyebrow}>FAQ</p>
        <h2 id="faq-title">What to know before you start.</h2>
      </div>
      <Accordion className="border-y">
        {questions.map(({ id, question, answer }) => (
          <AccordionItem key={id} value={id}>
            <AccordionTrigger className="min-h-12 text-left">{question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
