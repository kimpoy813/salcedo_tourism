import Image, {type ImageProps} from "next/image";
import {guideArtSrc, listingImage, type ListingMedia} from "@/lib/visitor-media";

/** Bundled art uses compact local WebPs that are also available in the installed
 * guide. Staff photography uses the normal Next image pipeline. */
export function GuideImage({src, size, alt, ...rest}: Omit<ImageProps, 'src'> & {src:string; size:'thumb'|'cover'}) {
  const local = guideArtSrc(src,size);
  return <Image {...rest} alt={alt} src={local || src} unoptimized={Boolean(local)} />;
}
export function PlaceThumbnail({place,width,height,className}: {place:ListingMedia; width:number; height:number; className?:string}) {
  const image = listingImage(place);
  return image ? <GuideImage src={image.url} size="thumb" width={width} height={height} className={className} alt="" /> : null;
}
