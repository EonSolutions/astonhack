import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const formatCategoryName = (category) => {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const fetchCollections = async () => {
  try {
    const snapshot = await getDocs(collection(db, "Collections")); // Replace with the actual collection name
    const dbCategories = snapshot.docs.map(doc => doc.id); // Extracts document IDs

    const formattedCategories = dbCategories.map(formatCategoryName);

    return formattedCategories;
  } catch (error) {
    console.error("Error fetching collections:", error);
    return [];
  }
};

async function getAllCategories() {
  let allItems = [];
  let allCategories = [];

  const formattedCategories = await fetchCollections();

  for (const formattedCategory of formattedCategories) {
    try {
      // 🔹 Convert formatted name back to Firestore-friendly format (underscores)
      const firestoreCategory = formattedCategory
        .toLowerCase()
        .replace(/\s/g, "_");

      const querySnapshot = await getDocs(collection(db, firestoreCategory));

      const collectionItems = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        category: formattedCategory, // ✅ Use formatted name in UI
        name: doc.data().name || "Unnamed Item",
        description: doc.data().description || "No description available",
        colour: doc.data().colour || "Unknown",
        image: doc.data().image || "",
      }));

      if (collectionItems.length > 0) {
        allCategories.push(formattedCategory); // ✅ Keep formatted categories
      }

      allItems = [...allItems, ...collectionItems];
    } catch (error) {
      console.error(`Error fetching collection ${formattedCategory}:`, error);
    }
  }

  return [allItems, allCategories];
}

export { getAllCategories, fetchCollections };