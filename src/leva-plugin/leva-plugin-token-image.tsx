import * as React from "react";
import {
  createPlugin,
  useInputContext,
  Components as LevaComponents,
} from "leva/plugin";
import {
  Button,
  HStack,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Box,
  Input,
  InputLeftElement,
  InputGroup,
  InputRightElement,
  SimpleGrid,
  Image,
  Center,
  Text,
  VStack,
} from "@chakra-ui/react";
import { loose } from "../chakra-loose";

const ButtonLoose = loose(Button);
const HStackLoose = loose(HStack);
const PopoverLoose = loose(Popover);
const PopoverBodyLoose = loose(PopoverBody);
const PopoverCloseButtonLoose = loose(PopoverCloseButton);
const PopoverContentLoose = loose(PopoverContent);
const PopoverFooterLoose = loose(PopoverFooter);
const PopoverHeaderLoose = loose(PopoverHeader);
const PopoverTriggerLoose = loose(PopoverTrigger);
const PortalLoose = loose(Portal);
const BoxLoose = loose(Box);
const InputLoose = loose(Input);
const InputLeftElementLoose = loose(InputLeftElement);
const InputGroupLoose = loose(InputGroup);
const InputRightElementLoose = loose(InputRightElement);
const SimpleGridLoose = loose(SimpleGrid);
const ImageLoose = loose(Image);
const CenterLoose = loose(Center);
const TextLoose = loose(Text);
const VStackLoose = loose(VStack);
import graphql from "babel-plugin-relay/macro";
import * as Icon from "../feather-icons";
import { usePagination, useQuery } from "relay-hooks";
import { levaPluginTokenImage_TokenImagesFragment$key } from "./__generated__/levaPluginTokenImage_TokenImagesFragment.graphql";
import { levaPluginTokenImage_TokenImagesQuery } from "./__generated__/levaPluginTokenImage_TokenImagesQuery.graphql";
import { useTokenImageUpload } from "../dm-area/token-image-upload";
import { useCurrent } from "../hooks/use-current";

const { Row, Label } = LevaComponents;

const TokenImageReference = () => {
  const { displayValue, setValue } = useInputContext<any>();
  const [node, selectFile] = useTokenImageUpload();

  return (
    <>
      <PortalLoose>{node}</PortalLoose>
      <Row input>
        <Label>Image</Label>
        <HStackLoose alignItems="center" spacing={1}>
          {displayValue ? (
            <>
              <BoxLoose>
                <PopoverLoose
                  isLazy
                  placement="top-start"
                  closeOnBlur={node === null}
                >
                  <PopoverTriggerLoose>
                    <ButtonLoose size="xs">Change</ButtonLoose>
                  </PopoverTriggerLoose>
                  <PortalLoose>
                    <PopoverContentLoose
                      width="400px"
                      bg="#1a1b2e"
                      borderColor="#333366"
                      color="#e8e6e1"
                    >
                      <TokenImagePopoverContent
                        onSelect={(value) => setValue(value)}
                        onSelectFile={(file, connection) =>
                          selectFile(file, [connection])
                        }
                      />
                    </PopoverContentLoose>
                  </PortalLoose>
                </PopoverLoose>
              </BoxLoose>
              <BoxLoose>
                <ButtonLoose
                  size="xs"
                  onClick={() => {
                    setValue(null);
                  }}
                >
                  Remove
                </ButtonLoose>
              </BoxLoose>
            </>
          ) : (
            <BoxLoose>
              <PopoverLoose isLazy placement="top-start" closeOnBlur={node === null}>
                <PopoverTriggerLoose>
                  <ButtonLoose size="xs">Add</ButtonLoose>
                </PopoverTriggerLoose>
                <PortalLoose>
                  <PopoverContentLoose width="400px">
                    <TokenImagePopoverContent
                      onSelect={(value) => setValue(value)}
                      onSelectFile={(file, connection) =>
                        selectFile(file, [connection])
                      }
                    />
                  </PopoverContentLoose>
                </PortalLoose>
              </PopoverLoose>
            </BoxLoose>
          )}
        </HStackLoose>
      </Row>
    </>
  );
};

const TokenImagesFragment = graphql`
  fragment levaPluginTokenImage_TokenImagesFragment on Query
  @argumentDefinitions(
    count: { type: "Int", defaultValue: 12 }
    cursor: { type: "String" }
    titleFilter: { type: "String" }
  )
  @refetchable(queryName: "levaPluginTokenImage_MoreTokenImagesQuery") {
    tokenImages(first: $count, after: $cursor, titleFilter: $titleFilter)
      @connection(key: "levaPluginTokenImage_tokenImages") {
      __id
      edges {
        node {
          id
          title
          url
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const TokenImagesQuery = graphql`
  query levaPluginTokenImage_TokenImagesQuery(
    $count: Int
    $titleFilter: String
  ) {
    ...levaPluginTokenImage_TokenImagesFragment
      @arguments(count: $count, titleFilter: $titleFilter)
  }
`;

const TokenImageList = (props: {
  data: levaPluginTokenImage_TokenImagesFragment$key;
  onSelect: (tokenImageId: string) => void;
  onSelectFile: (file: File, connection: string) => void;
  titleFilter: string;
  setTitleFilter: (title: string) => void;
}) => {
  const pagination = usePagination(TokenImagesFragment, props.data);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const elementRef = React.useRef<HTMLDivElement>(null);
  return (
    <>
      <PopoverHeaderLoose>Select Token Image</PopoverHeaderLoose>
      <PopoverCloseButtonLoose />
      <PopoverBodyLoose
        height="200px"
        overflowY="scroll"
        ref={elementRef}
        onScroll={() => {
          if (elementRef.current) {
            const htmlElement = elementRef.current;
            if (
              htmlElement.offsetHeight + htmlElement.scrollTop >=
              0.95 * htmlElement.scrollHeight
            ) {
              pagination.loadNext(16);
            }
          }
        }}
      >
        <SimpleGridLoose columns={4} spacing={2}>
          {pagination.data.tokenImages?.edges.map((edge) => (
            <CenterLoose key={edge.node.id}>
              <VStackLoose
                as="button"
                spacing={0}
                onClick={() => props.onSelect(edge.node.id)}
              >
                <ImageLoose
                  borderRadius="full"
                  boxSize="50px"
                  src={edge.node.url}
                  alt={edge.node.title}
                />
                <TextLoose fontSize="xs" noOfLines={1}>
                  {edge.node.title}
                </TextLoose>
              </VStackLoose>
            </CenterLoose>
          ))}
        </SimpleGridLoose>
      </PopoverBodyLoose>
      <PopoverFooterLoose>
        <HStackLoose alignItems="center" justifyContent="flex-end" spacing={1}>
          <BoxLoose marginRight="auto" marginLeft={0}>
            <InputGroupLoose size="xs">
              <InputLeftElementLoose
                pointerEvents="none"
                children={<Icon.Filter color="gray.300" />}
              />
              <InputLoose
                variant="flushed"
                placeholder="Filter"
                value={props.titleFilter}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                  props.setTitleFilter(ev.target.value);
                }}
              />
              <InputRightElementLoose width="1rem">
                {props.titleFilter !== "" ? (
                  <ButtonLoose
                    size="xs"
                    onClick={() => props.setTitleFilter("")}
                    variant="unstyled"
                  >
                    <Icon.X color="black" />
                  </ButtonLoose>
                ) : null}
              </InputRightElementLoose>
            </InputGroupLoose>
          </BoxLoose>
          <input
            style={{ display: "none" }}
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(ev) => {
              if (!ev.target.files) {
                return;
              }
              props.onSelectFile(
                ev.target.files[0]!,
                pagination.data.tokenImages?.__id!
              );
            }}
          />
          {props.titleFilter === "" ? (
            <ButtonLoose
              size="xs"
              onClick={() => {
                inputRef.current?.click();
              }}
            >
              Upload new Image
            </ButtonLoose>
          ) : null}
        </HStackLoose>
      </PopoverFooterLoose>
    </>
  );
};

const TokenImagePopoverContent = (props: {
  onSelect: (tokenImageId: string) => void;
  onSelectFile: (file: File, connection: string) => void;
}) => {
  const [titleFilter, setTitleFilter] = React.useState("");

  const query = useQuery<levaPluginTokenImage_TokenImagesQuery>(
    TokenImagesQuery,
    React.useMemo(
      () => ({
        count: 12,
        titleFilter: titleFilter === "" ? null : titleFilter,
      }),
      [titleFilter]
    )
  );

  const [, latestData] = useCurrent(query.data, !query.error && !query.data, 0);

  return latestData ? (
    <TokenImageList
      data={latestData}
      onSelect={props.onSelect}
      onSelectFile={props.onSelectFile}
      titleFilter={titleFilter}
      setTitleFilter={setTitleFilter}
    />
  ) : null;
};

const normalize = (input: { value: string | null }) => ({ value: input.value });

export const levaPluginTokenImage = createPlugin({
  normalize,
  component: TokenImageReference,
});
