// 1. Define the City Logo Mapping
import { object, string } from 'astro:schema'
import aurora from '../assets/cities/aurora.svg'
import barrie from '../assets/cities/barrie.png'
import bradford from '../assets/cities/bradford.svg'
import innisfil from '../assets/cities/innisfil.svg'
import king from '../assets/cities/king.png'
import markham from '../assets/cities/markham.png'
import newmarket from '../assets/cities/newmarket.png'
import richmond_hill from '../assets/cities/richmond-hill.svg'
import stouffville from '../assets/cities/stouffville.png'
import vaughan from '../assets/cities/vaughan.svg'
import carriage_house_panels from '../assets/doorTypes/carriage-house-panels.webp'
import flush_panels from '../assets/doorTypes/flush-panels.webp'
import long_ranch_panels from '../assets/doorTypes/long-ranch-panels.webp'
import ribbed_panels from '../assets/doorTypes/ribbed-panels.webp'
import liftmaster_87504_267 from '../assets/openers/x83650267_Hero_1.png'

const cityLogoMap = {
    'vaughan': vaughan,
    'markham': markham,
    'richmond-hill': richmond_hill,
    'newmarket': newmarket,
    'aurora': aurora,
    'stouffville': stouffville,
    'king': king,
    'barrie': barrie,
    'bradford': bradford,
    'innisfil': innisfil,
    // Fallback for any city not listed:
    'default': aurora,
};
const doorTypeImage = {
    'long-ranch-panels': long_ranch_panels,
    'flush-panels': flush_panels,
    'carriage-house-panels': carriage_house_panels,
    'ribbed-panels': ribbed_panels,
    'default': ribbed_panels
}
const openerImage = {
    'liftmaster-87504-267': liftmaster_87504_267,
    'flush-panels': flush_panels,
    'carriage-house-panels': carriage_house_panels,
    'ribbed-panels': ribbed_panels,
    'default': ribbed_panels
}



export function capitalizeWords(str: string): string {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function getCityLogo(city: string) {
    const logoUrl = cityLogoMap[city as keyof typeof cityLogoMap] || cityLogoMap.default;
    return logoUrl;
}
export function getDoorTypeImage(type: string) {
    const imageUrl = doorTypeImage[type as keyof typeof doorTypeImage] || doorTypeImage.default;
    return imageUrl;
}
export function getOpenerImage(type: string) {
    const imageUrl = openerImage[type as keyof typeof openerImage] || openerImage.default;
    return imageUrl;
}