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



export function capitalizeWords(str: string): string {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function getCityLogo(city: string) {
    const logoUrl = cityLogoMap[city as keyof typeof cityLogoMap] || cityLogoMap.default;
    return logoUrl;
}