import { Extension, ReactRenderer } from "@tiptap/react";
import Suggestion, { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import tippy, { Instance as TippyInstance } from "tippy.js";
import {
  CodeSquare,
  Heading1,
  Heading2,
  Heading3,
  Image,
  LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Pilcrow,
  Quote,
  Sigma,
  Table,
} from "lucide-react";
import SuggestionList from "./SuggestionList";
import { fuzzyFilter } from "@/lib/utils";

interface SuggestionItem {
  icon: React.ReactNode;
  label: string;
  command: string;
  props?: Record<string, any>;
  shortcut?: string;
  dialog?: string;
  [key: string]: any;
}

interface SlashCommandProps extends SuggestionProps {
  items: SuggestionItem[];
  command: (item: SuggestionItem) => void;
  editor: any;
  range: any;
  clientRect?: (() => DOMRect) | null;
}

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        items: ({ query }: { query: string }) => {
          // Filter suggestions based on the query
          const suggestions: SuggestionItem[] = [
            { icon: <Pilcrow />, label: "Paragraph", command: "setParagraph" },
            {
              icon: <Heading1 />,
              label: "Heading 1",
              command: "setHeading",
              props: { level: 1 },
              shortcut: "#",
            },
            {
              icon: <Heading2 />,
              label: "Heading 2",
              command: "setHeading",
              props: { level: 2 },
              shortcut: "##",
            },
            {
              icon: <Heading3 />,
              label: "Heading 3",
              command: "setHeading",
              props: { level: 3 },
              shortcut: "###",
            },
            {
              icon: <List />,
              label: "Bullet List",
              command: "toggleBulletList",
              shortcut: "-",
            },
            {
              icon: <ListOrdered />,
              label: "Numbered List",
              command: "toggleOrderedList",
              shortcut: "1.",
            },
            {
              icon: <ListTodo />,
              label: "Task List",
              command: "toggleTaskList",
              shortcut: "[]",
            },
            {
              icon: <Quote />,
              label: "Blockquote",
              command: "toggleBlockquote",
              shortcut: ">",
            },
            {
              icon: <CodeSquare />,
              label: "Code Block",
              command: "toggleCodeBlock",
              shortcut: "```",
            },
            { icon: <Table />, label: "Table", command: "insertTable" },
            {
              icon: <Minus />,
              label: "Horizontal Rule",
              command: "setHorizontalRule",
              shortcut: "---",
            },

            {
              icon: <LinkIcon />,
              label: "Link",
              command: "custom",
              dialog: "openLinkDialog",
            },
            {
              icon: <Image />,
              label: "Image",
              command: "custom",
              dialog: "openImageDialog",
            },
            {
              icon: <Sigma />,
              label: "Math Equation",
              command: "custom",
              dialog: "openMathDialog",
            },
          ];

          return fuzzyFilter(query, suggestions);
        },
        render: () => {
          let component: ReactRenderer | null = null;
          let popup: TippyInstance[] | null = null;

          return {
            onStart: (props: SlashCommandProps) => {
              component = new ReactRenderer(SuggestionList, {
                props: {
                  items: props.items,
                  command: props.command,
                  editor: props.editor,
                  range: props.range,
                },
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },

            onUpdate: (props: SlashCommandProps) => {
              if (component) {
                component.updateProps({
                  items: props.items,
                  command: props.command,
                  editor: props.editor,
                  range: props.range,
                });
              }

              if (popup && popup[0]) {
                if (props.items.length === 0) {
                  // Hide the popup if there are no items
                  popup[0].hide();
                } else {
                  // Show the popup if there are items
                  popup[0].show();
                }

                if (!props.clientRect) return;
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              }
            },

            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === "Escape") {
                if (popup && popup[0]) {
                  popup[0].hide();
                }
                return true;
              }
              
              return (component?.ref as any)?.onKeyDown?.(props.event) || false;
            },

            onExit: () => {
              if (popup && popup[0]) {
                popup[0].destroy();
              }
              if (component) {
                component.destroy();
              }
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});