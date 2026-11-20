import Image from "next/image";
import {guideArtSrc, listingImage, type ListingMedia} from "@/lib/visitor-media";

interface GuideImageProps {
  src: string;
  size: "thumb" | "cover";
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
}

/** Bundled art ships as AVIF with a WebP fallback and is also available in the
 * installed guide. Staff photography uses the normal Next image pipeline. */
export function GuideImage({src, size, alt, width, height, fill, sizes, className, priority, loading}: GuideImageProps) {
  const local = guideArtSrc(src,size);
  if (!local) {
    return <Image src={src} alt={alt} width={width} height={height} fill={fill} sizes={sizes} className={className} priority={priority} loading={loading} />;
  }
  const avif = local.replace(/\.webp$/, ".avif");
  return <picture>
    <source srcSet={avif} type="image/avif" sizes={sizes} />
    <img
      src={local}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      className={className}
      loading={priority ? "eager" : loading ?? "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      style={fill ? {position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain"} : undefined}
    />
  </picture>;
}

export function PlaceThumbnail({place,width,height,className}: {place:ListingMedia; width:number; height:number; className?:string}) {
  const image = listingImage(place);
  return image ? <GuideImage src={image.url} size="thumb" width={width} height={height} className={className} alt="" /> : null;
}
