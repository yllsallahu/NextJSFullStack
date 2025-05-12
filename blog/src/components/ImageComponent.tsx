import Image from 'next/image'
import myImage from '../public/myImage.jpg'

const ImageComponent = () => (
    <div>
        <Image
            src={myImage}
            alt="Përshkrimi i imazhit"
            width={500}
            height={300}
        />
    </div>
)

export default ImageComponent
