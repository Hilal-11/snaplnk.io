const personalLogos = ['Notion', 'Evernote', 'Todoist', 'Obsidian', 'Roam', 'Bear', 'Day One', 'Craft', 'Apple', 'Mem']
const teamLogos = ['Slack', 'Asana', 'Linear', 'Jira', 'Trello', 'Monday', 'ClickUp', 'Basecamp', 'Height', 'Coda']

const personalLogoss = [
  {
    name: "Notion",
    logo: "https://cdn.simpleicons.org/notion",
  },
  {
    name: "Evernote",
    logo: "https://cdn.simpleicons.org/evernote",
  },
  {
    name: "Todoist",
    logo: "https://cdn.simpleicons.org/todoist",
  },
  {
    name: "Obsidian",
    logo: "https://cdn.simpleicons.org/obsidian",
  },
  {
    name: "Roam",
    logo: "https://cdn.simpleicons.org/roamresearch",
  },
  {
    name: "Bear",
    logo: "https://www.google.com/s2/favicons?domain=bear.app&sz=128",
  },
  {
    name: "Day One",
    logo: "https://www.google.com/s2/favicons?domain=dayoneapp.com&sz=128", // closest available
  },
  {
    name: "Craft",
    logo: "https://cdn.simpleicons.org/craftcms",
  },
  {
    name: "Apple",
    logo: "https://cdn.simpleicons.org/apple",
  },
  {
    name: "Mem",
    logo: "https://www.google.com/s2/favicons?domain=mem.ai&sz=128", // placeholder
  },
];
const teamLogoss = [
  {
    name: "Slack",
    logo: "https://www.google.com/s2/favicons?domain=slack.com&sz=128",
  },
  {
    name: "Asana",
    logo: "https://cdn.simpleicons.org/asana",
  },
  {
    name: "Linear",
    logo: "https://cdn.simpleicons.org/linear",
  },
  {
    name: "Jira",
    logo: "https://cdn.simpleicons.org/jira",
  },
  {
    name: "Trello",
    logo: "https://cdn.simpleicons.org/trello",
  },
  {
    name: "Monday",
    logo: "https://www.google.com/s2/favicons?domain=monday.com&sz=128",
  },
  {
    name: "ClickUp",
    logo: "https://cdn.simpleicons.org/clickup",
  },
  {
    name: "Basecamp",
    logo: "https://cdn.simpleicons.org/basecamp",
  },
  {
    name: "Height",
    logo: "https://www.google.com/s2/favicons?domain=height.app&sz=128",
  },
  {
    name: "Coda",
    logo: "https://cdn.simpleicons.org/coda",
  },
];

function LogoCell({ name, logo }: { name: string; logo: string }) {
  return (
    <div className=" flex items-center gap-2 justify-center px-2 py-[28px]
  border-b border-black/[0.06]
  lg:border-r border-black/[0.06]
  
  [&:nth-last-child(-n+2)]:border-b-0
  sm:[&:nth-child(2n)]:border-r
  sm:[&:nth-child(5n)]:border-r-0
  sm:[&:nth-last-child(-n+2)]:border-b
  sm:[&:nth-last-child(-n+5)]:border-b-0">
      <img
        src={logo}
        alt={""}
        width={80}
        height={24}
        className="h-5 w-auto object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-200"
      />
      <span className="text-[14px] font-sans font-semibold text-gray-500 tracking-tight whitespace-nowrap">
        {name}
      </span>
    </div>
  )
}

function TrustedSection() {
  return (
    <section className="max-w-7xl mx-auto font-sans py-10 h-auto overflow-hidden">
      <p className="text-center text-[14px] text-gray-400 mb-6">
        Trusted by <strong className="text-gray-500 font-sans font-medium">2M+ people</strong> to keep life organized
      </p>

      <div className="grid grid-cols-[1fr_1px_1fr] border-t border-b border-black/[0.06]">

        {/* Personal col */}
        <div className="px-2 lg:px-8">
          <div className="flex flex-wrap justify-center -mt-[11px]">
            <span className="text-sm border border-yellow-400 text-neutral-900 bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] px-3 py-0.5 rounded-md">
              Personal
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
            {personalLogoss.map(({ name, logo }) => <LogoCell key={name} name={name} logo={logo} />)}
          </div>
        </div>

        {/* Divider */}
        <div className="bg-black/[0.06]" />

        {/* Teams col */}
        <div className="px-8">
          <div className="flex flex-wrap justify-center -mt-[11px]">
            <span className="text-sm border border-yellow-400 text-neutral-900 bg-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] px-3 py-0.5 rounded-md">
              Teams
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
            {teamLogoss.map(({ name, logo }) => <LogoCell key={name} name={name} logo={logo} />)}
          </div>
        </div>

      </div>
    </section>
  )
}
export default TrustedSection