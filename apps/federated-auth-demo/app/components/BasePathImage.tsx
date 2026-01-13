import Image from "next/image";
import type { ImageProps } from "next/image";
import { withBasePath } from "../../lib/utils";

type BasePathImageProps = Omit<ImageProps, "src"> & {
  src: string;
  className?: string;
};

/**
 * A component that automatically adds the basePath to the src of an image
 * This ensures images work correctly when the app is deployed with a basePath
 */
const BasePathImage = (props: BasePathImageProps) => {
  const { src, width, height, alt, className, ...rest } = props;

  // Use the utility function for consistent basePath handling
  const fullSrc = withBasePath(src);

  return (
    <Image
      src={fullSrc}
      alt={alt}
      width={typeof width === "number" ? width : undefined}
      height={typeof height === "number" ? height : undefined}
      className={className}
      {...rest}
    />
  );
};

export default BasePathImage;
