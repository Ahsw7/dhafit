import { Section } from "../Layout";
import { techSkills } from "~/lib/_data/skillLists";
import Icon from "~/lib/getIcons";
import useTranslation from "~/lib/useTranslation";

const TechSkillItem = ({ text }: { text: string }) => {
  const iconType = text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "").toLowerCase();
  return (
    <div className="flex items-center">
      <span className="text-2xl">
        <Icon type={iconType} />
      </span>
      <span className="pl-4">{text}</span>
    </div>
  );
};

export default function TechSection() {
  const { locale } = useTranslation();

  return (
    <Section id="technologies" title={locale.techSection}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-6">
        {techSkills.map((item, index) => {
          return <TechSkillItem key={index} text={item} />;
        })}
      </div>
    </Section>
  );
}
