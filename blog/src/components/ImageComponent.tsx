import Image from 'next/image'

interface ImageComponentProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
}

const ImageComponent = ({ 
    src, 
    alt, 
    width = 500, 
    height = 300, 
    className 
}: ImageComponentProps) => (
    <div className={className}>
        <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="object-cover"
        />
    </div>
)

export default ImageComponent
