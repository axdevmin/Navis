import * as React from "react";
import { useQuery } from "relay-hooks";
import type { Area } from "react-easy-crop/types";
import useMeasure from "react-use-measure";
import {
  Button,
  FormControl,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Text,
  FormLabel,
  Input,
  Image,
  Grid,
  GridItem,
  Heading,
} from "@chakra-ui/react";
import { loose } from "../chakra-loose";

const ButtonLoose = loose(Button);
const FormControlLoose = loose(FormControl);
const SliderLoose = loose(Slider);
const SliderFilledTrackLoose = loose(SliderFilledTrack);
const SliderThumbLoose = loose(SliderThumb);
const SliderTrackLoose = loose(SliderTrack);
const StackLoose = loose(Stack);
const TextLoose = loose(Text);
const FormLabelLoose = loose(FormLabel);
const InputLoose = loose(Input);
const ImageLoose = loose(Image);
const GridLoose = loose(Grid);
const GridItemLoose = loose(GridItem);
const HeadingLoose = loose(Heading);
import graphql from "babel-plugin-relay/macro";
import { loadImage } from "../util";
import { tokenImageCropper_TokenLibraryImagesQuery } from "./__generated__/tokenImageCropper_TokenLibraryImagesQuery.graphql";
import { useStaticRef } from "../hooks/use-static-ref";
import { useWindowDimensions } from "../hooks/use-window-dimensions";
import type CropperType from "react-easy-crop";

const TokenLibraryImagesQuery = graphql`
  query tokenImageCropper_TokenLibraryImagesQuery($sourceImageSha256: String!) {
    tokenImages(first: 20, sourceImageSha256: $sourceImageSha256) {
      edges {
        node {
          id
          title
          url
        }
      }
    }
  }
`;

export const TokenImageCropper = (props: {
  imageUrl: string;
  initialImageTitle: string;
  sourceImageHash: string;
  onConfirm: (
    params:
      | {
          type: "File";
          file: File;
          title: string;
        }
      | {
          type: "TokenImage";
          tokenImageId: string;
        }
  ) => unknown;
  onClose: () => void;
}): React.ReactElement => {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(
    null
  );
  const [title, setTitle] = React.useState(props.initialImageTitle);
  const data = useQuery<tokenImageCropper_TokenLibraryImagesQuery>(
    TokenLibraryImagesQuery,
    useStaticRef(() => ({
      sourceImageSha256: props.sourceImageHash,
    }))
  );

  const windowDimensions = useWindowDimensions();
  const [imageDimensions, setImageDimensions] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  const [ref, bounds] = useMeasure();
  const cropperRef = React.useRef<CropperType | null>();

  const [cropSize, setCropSize] = React.useState<null | {
    width: number;
    height: number;
    minZoom: number;
    maxZoom: number;
  }>(null);

  React.useEffect(() => {
    if (!cropperRef.current?.imageRef || bounds.height === 0) {
      return;
    }

    const imageDimensions = {
      width: cropperRef.current.imageRef.width,
      height: cropperRef.current.imageRef.height,
    };

    let ratio = imageDimensions.width / imageDimensions.height;
    let width = imageDimensions.width;
    let height = imageDimensions.height;

    const minBoundSide = Math.min(bounds.width - 30, bounds.height - 30);

    let sideLength = Math.min(minBoundSide, width);

    let minZoom = sideLength / imageDimensions.width;

    if (ratio > 1) {
      sideLength = Math.min(minBoundSide, height);
      minZoom = sideLength / imageDimensions.height;
    }

    let maxZoom = (imageDimensions.width * 4) / sideLength;
    setCropSize({ height: sideLength, width: sideLength, minZoom, maxZoom });
    setZoom((zoom) => {
      if (zoom < minZoom) {
        return minZoom;
      }
      if (zoom > maxZoom) {
        return maxZoom;
      }
      return zoom;
    });
  }, [windowDimensions, imageDimensions, bounds]);

  return (
    <>
      <GridLoose
        position="absolute"
        h="100vh"
        width="100%"
        templateRows="repeat(4, 1fr)"
        templateColumns="repeat(5, 1fr)"
        gap={4}
        zIndex={1}
        padding={4}
      >
        <GridItemLoose
          rowSpan={{ base: 1, xl: 4 }}
          colSpan={{ base: 5, xl: 1 }}
          display="flex"
          alignItems="center"
        >
          {data.data?.tokenImages?.edges.length ? (
            <StackLoose
              spacing={2}
              padding={3}
              borderRadius={3}
              background="#1a1b2e"
              maxHeight={500}
              zIndex={10}
              width="100%"
              maxWidth={{ base: undefined, xl: "300px" }}
            >
              <HeadingLoose size="xs">Token Images from this Source</HeadingLoose>
              <StackLoose direction={{ base: "row", xl: "column" }}>
                {data.data.tokenImages.edges.map((edge) => (
                  <GridLoose
                    templateRows="repeat(3, 1fr)"
                    templateColumns="repeat(5, 1fr)"
                    gap={2}
                    height={75}
                  >
                    <GridItemLoose colSpan={2} rowSpan={3}>
                      <ImageLoose
                        src={edge.node.url}
                        key={edge.node.id}
                        height={75}
                        width={75}
                      />
                    </GridItemLoose>
                    <GridItemLoose colSpan={3} rowSpan={1}>
                      <TextLoose
                        paddingTop={3}
                        width="100%"
                        color="#e8e6e1"
                        fontSize="xs"
                        maxWidth={100}
                        whiteSpace="nowrap"
                        textOverflow="ellipsis"
                        overflow="hidden"
                      >
                        {edge.node.title}
                      </TextLoose>
                    </GridItemLoose>
                    <GridItemLoose colSpan={3} rowSpan={2}>
                      <ButtonLoose
                        size="sm"
                        onClick={() => {
                          props.onConfirm({
                            type: "TokenImage",
                            tokenImageId: edge.node.id,
                          });
                        }}
                      >
                        Use this image.
                      </ButtonLoose>
                    </GridItemLoose>
                  </GridLoose>
                ))}
              </StackLoose>
            </StackLoose>
          ) : null}
        </GridItemLoose>
        <GridItemLoose
          colSpan={{ base: 5, xl: 4 }}
          rowSpan={{ base: 3, xl: 3 }}
          ref={ref}
          position="relative"
        >
          <Cropper
            // @ts-ignore
            ref={cropperRef}
            image={props.imageUrl}
            crop={crop}
            rotation={rotation}
            minZoom={cropSize?.minZoom ?? 1}
            maxZoom={cropSize?.maxZoom ?? 1}
            zoom={zoom}
            onRotationChange={(rotation) => {
              setRotation(rotation);
            }}
            onCropChange={setCrop}
            onCropComplete={(_, croppedAreaPixels) => {
              setCroppedAreaPixels(croppedAreaPixels);
            }}
            onZoomChange={setZoom}
            onMediaLoaded={({ width, height }) => {
              setImageDimensions({ width, height });
            }}
            cropSize={cropSize ?? undefined}
            style={{
              containerStyle: {
                height: bounds.height,
                width: bounds.width,
                overflow: "visible",
              },
            }}
          />
        </GridItemLoose>
        <GridItemLoose colSpan={{ base: 5, xl: 4 }} rowSpan={{ base: 2, xl: 1 }} />
        <StackLoose
          position="fixed"
          bottom={4}
          left="50%"
          transform="auto"
          translateX="-50%"
          background="#1a1b2e"
          padding={5}
          borderRadius={3}
          maxWidth={600}
          maxHeight="80vh"
          overflowY="auto"
          spacing={4}
          zIndex={100}
        >
            <TextLoose fontSize="small">
              Please select a rectangular part from the image that will be used
              as the token image.
            </TextLoose>
            <FormControlLoose id="slider">
              <FormLabelLoose fontSize="small">Zoom</FormLabelLoose>
              <SliderLoose
                aria-label="slider-zoom"
                min={cropSize?.minZoom}
                max={cropSize?.maxZoom}
                step={0.01}
                value={zoom}
                onChange={(zoom: number) => setZoom(zoom)}
                size="sm"
              >
                <SliderTrackLoose>
                  <SliderFilledTrackLoose />
                </SliderTrackLoose>
                <SliderThumbLoose />
              </SliderLoose>
            </FormControlLoose>
            <FormControlLoose id="rotation">
              <FormLabelLoose fontSize="small">Rotation</FormLabelLoose>
              <SliderLoose
                aria-label="slider-rotation"
                min={0}
                max={360}
                step={0.01}
                value={rotation}
                onChange={(rotation: number) => setRotation(rotation)}
                size="sm"
              >
                <SliderTrackLoose>
                  <SliderFilledTrackLoose />
                </SliderTrackLoose>
                <SliderThumbLoose />
              </SliderLoose>
            </FormControlLoose>
            <FormControlLoose id="token-title">
              <FormLabelLoose fontSize="small">Title</FormLabelLoose>
              <InputLoose
                value={title}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(ev.target.value)
                }
                size="sm"
              />
            </FormControlLoose>
            <StackLoose
              spacing={4}
              direction="row"
              align="center"
              alignSelf="flex-end"
            >
              <ButtonLoose onClick={props.onClose} variant="ghost">
                Annuler
              </ButtonLoose>
              <ButtonLoose
                colorScheme="teal"
                isDisabled={croppedAreaPixels === null}
                onClick={async () => {
                  if (!croppedAreaPixels) {
                    return;
                  }
                  const file = await cropImage(
                    props.imageUrl,
                    croppedAreaPixels,
                    rotation
                  );
                  props.onConfirm({ type: "File", file, title });
                }}
              >
                Confirmer
              </ButtonLoose>
            </StackLoose>
        </StackLoose>
      </GridLoose>
    </>
  );
};

const Cropper = React.lazy(() => import("react-easy-crop"));

const cropImage = async (imageUrl: string, crop: Area, rotation: number) => {
  const image = await loadImage(imageUrl).promise;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // set each dimensions to double largest dimension to allow for a safe area for the
  // image to rotate in without being clipped by canvas context
  canvas.width = safeArea;
  canvas.height = safeArea;

  // translate canvas context to a central location on image to allow rotating around the center.
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(degreeToRadian(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = crop.width;
  canvas.height = crop.height;

  // paste generated rotate image with correct offsets for x,y crop values.
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - crop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - crop.y)
  );

  return await new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) {
        return reject(new Error("Unexpected error."));
      }
      resolve(new File([blob], "image.webp"));
    }, "image/webp");
  });
};

const degreeToRadian = (degree: number) => (degree * Math.PI) / 180;
