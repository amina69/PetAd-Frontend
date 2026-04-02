import type { Pet } from "../ui/PetCard";
import dogImg from "../../assets/dog.png";
import dog1Img from "../../assets/dog_1.png";
import parrotImg from "../../assets/parrot.png";
import parrot1Img from "../../assets/parrot_1.png";
import catImg from "../../assets/cat.png";
import cat1Img from "../../assets/cat_1.png";
import cat2Img from "../../assets/cat_2.png";

// Mock Data – 12 pets for the 4×3 grid
export const MOCK_LISTINGS: Pet[] = [
    {
        id: "h1",
        name: "Pet For Adoption",
        breed: "Dog, German Shepard",
        category: "dog",
        age: "4yrs old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: dogImg,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h2",
        name: "Pet For Adoption",
        breed: "Cat, Tabby",
        category: "cat",
        age: "4yrs old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: cat1Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h3",
        name: "Pet For Adoption",
        breed: "Parrot",
        category: "bird",
        age: "4yrs old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: parrotImg,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h4",
        name: "Pet For Adoption",
        breed: "Cat, Persian",
        category: "cat",
        age: "4yrs old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: catImg,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h5",
        name: "Pet For Adoption",
        breed: "Dog, Golden Retriever",
        category: "dog",
        age: "4yrs old",
        location: "Ikeja, Lagos Nigeria",
        imageUrl: dog1Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h6",
        name: "Pet For Adoption",
        breed: "Cat, Siamense",
        category: "cat",
        age: "4yrs old",
        location: "Ikeja, Lagos Nigeria",
        imageUrl: cat2Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h7",
        name: "Pet For Adoption",
        breed: "Parrot, macaw",
        category: "bird",
        age: "1yr old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: parrot1Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h8",
        name: "Pet For Adoption",
        breed: "Parrot",
        category: "bird",
        age: "4yrs old",
        location: "Abuja, Nigeria",
        imageUrl: parrotImg,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h9",
        name: "Pet For Adoption",
        breed: "Dog, Poodle",
        category: "dog",
        age: "2yrs old",
        location: "Mainland, Lagos Nigeria",
        imageUrl: dogImg,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h10",
        name: "Pet For Adoption",
        breed: "Cat, Siamese",
        category: "cat",
        age: "3yrs old",
        location: "Lekki, Lagos Nigeria",
        imageUrl: cat1Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h11",
        name: "Pet For Adoption",
        breed: "Parrot, Cockatoo",
        category: "bird",
        age: "5yrs old",
        location: "Ikeja, Lagos Nigeria",
        imageUrl: parrot1Img,
        isFavourite: false,
        isInterested: false,
    },
    {
        id: "h12",
        name: "Pet For Adoption",
        breed: "Dog, Husky",
        category: "dog",
        age: "1yr old",
        location: "Abuja, Nigeria",
        imageUrl: dog1Img,
        isFavourite: false,
        isInterested: false,
    },
];

export const CATEGORY_OPTIONS = [
    { value: "all", label: "Category: All" },
    { value: "dog", label: "Dog" },
    { value: "cat", label: "Cat" },
    { value: "bird", label: "Bird" },
];

export interface PetListingSectionProps {
    onOwnerClick?: () => void;
}
