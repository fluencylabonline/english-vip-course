import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebaseConfig';
import toast, {Toaster} from 'react-hot-toast';
import Image from 'next/image';
import Upload from '../../../../images/rb_7025.png';

// Pre-set colors with hover variants
const presetColors = {
  blue: { normal: 'bg-blue-500', hover: 'hover:bg-blue-700' },
  yellow: { normal: 'bg-yellow-500', hover: 'hover:bg-yellow-700' },
  red: { normal: 'bg-red-500', hover: 'hover:bg-red-700' },
  black: { normal: 'bg-black', hover: 'hover:bg-gray-800' },
  green: { normal: 'bg-green-500', hover: 'hover:bg-green-700' }
};

const SlideUploadModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [title, setTitle] = useState('');
  const [highlightedText, setHighlightedText] = useState('');
  const [highlightColor, setHighlightColor] = useState('blue');
  const [buttonTitle, setButtonTitle] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'active'>('upload'); // State for active tab

  const clearFields = () => {
    setTitle('');
    setHighlightedText('');
    setHighlightColor('blue');
    setButtonTitle('');
    setButtonLink('');
    setImage(null);
  };

  useEffect(() => {
    // Fetch active slides from Firestore
    const fetchSlides = async () => {
      const slidesCollection = collection(db, "slides");
      const slidesSnapshot = await getDocs(slidesCollection);
      const slidesList = slidesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSlides(slidesList);
    };

    if (isOpen) {
      fetchSlides();
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (image && title && buttonTitle && buttonLink) {
      setUploading(true);
      try {
        // Upload image to Firebase Storage
        const imageRef = ref(storage, `slides/${image.name}`);
        await uploadBytes(imageRef, image);
        const imageURL = await getDownloadURL(imageRef);

        // Add slide data to Firestore
        const slidesCollection = collection(db, "slides");
        await addDoc(slidesCollection, {
          image: imageURL,
          text: title,
          highlightedText: highlightedText,  // Store the highlighted text
          highlightColor: highlightColor,  // Store the highlight color
          buttonLabel: buttonTitle,
          buttonLink: buttonLink,
        });

        toast.success("Slide uploaded successfully!");
        onClose(); // Close the modal after success
        clearFields();
      } catch (error) {
        console.error("Error uploading slide:", error);
        toast.error("Error uploading slide!");
      } finally {
        setUploading(false);
      }
    } else {
      toast.error("Please fill in all fields and upload an image.");
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    try {
      // Delete the slide from Firestore
      const slideRef = doc(db, "slides", slideId);
      await deleteDoc(slideRef);
      toast.success("Slide deleted successfully!");
      setSlides(slides.filter(slide => slide.id !== slideId)); // Remove from UI
    } catch (error) {
      console.error("Error deleting slide:", error);
      toast.error("Error deleting slide!");
    }
  };

  return (
    <div
      className={`fixed inset-0 text-black bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${isOpen ? 'block' : 'hidden'}`}
      onClick={onClose}
    >
      <Toaster />
      <div
        className="bg-white p-6 rounded-lg w-full h-[90vh] max-w-4xl m-6 sm:overflow-y-hidden overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Modal Header and Tab Navigation */}
        <div className="flex sm:flex-row flex-col items-center sm:gap-0 gap-3 justify-between mb-4">
          <h2 className="sm:text-2xl w-full text-xl font-bold">Gerenciar Painel</h2>
          <div className="flex flex-row gap-2 sm:justify-end justify-center w-full">
            <button
              onClick={() => setActiveTab('upload')}
              className={`sm:px-4 px-1 sm:py-2 py-1 sm:w-fit w-full text-sm font-semibold rounded-lg ${activeTab === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Upload Slide
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`sm:px-4 px-1 sm:py-2 py-1 sm:w-fit w-full text-sm font-semibold rounded-lg ${activeTab === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Slides ativos
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <div className='flex flex-col gap-4'>
            <div className='flex sm:flex-row flex-col sm:items-center items-start gap-4 w-full'>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Título do slide</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-blue-600"
                  placeholder="Título do slide"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Texto destacado</label>
                <input
                  type="text"
                  value={highlightedText}
                  onChange={(e) => setHighlightedText(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-blue-600"
                  placeholder="Texto que deve ser destacado"
                />
              </div>

              <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Cor de destaque</label>
              <select
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-blue-600"
              >
                {Object.keys(presetColors).map((color) => (
                  <option key={color} value={color}>
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            </div>

            <div className='flex sm:flex-row flex-col sm:items-center items-start gap-2'>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Título do botão</label>
                <input
                  type="text"
                  value={buttonTitle}
                  onChange={(e) => setButtonTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-blue-600"
                  placeholder="Título do botão"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Link do botão</label>
                <input
                  type="url"
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-blue-600"
                  placeholder="Link do botão"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 space-y-2">
              <label className="text-sm font-bold text-gray-500 tracking-wide">Adicionar Imagem de Fundo</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col rounded-lg border-4 border-dashed w-full h-26 p-10 group text-center">
                  <div className="h-full w-full text-center flex flex-row items-center justify-center">
                    <div className="flex flex-auto max-h-48 w-2/5 mx-auto -mt-10">
                      <Image
                        src={Upload}
                        alt="Upload Image"
                        width={144}
                        height={144}
                      />
                    </div>
                    <p className="pointer-none text-gray-500">
                      <a href="#" className="text-blue-600 hover:underline duration-300 transition-all ease-in-out">Selecione um arquivo</a> do seu computador
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-row gap-2 justify-end items-center">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 duration-300 ease-in-out transition-all text-black rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className={`px-4 py-2 bg-green-600 hover:bg-green-800 duration-300 ease-in-out transition-all text-white font-semibold rounded-lg ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? 'Uploading...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Active Slides</h3>
            {slides.length > 0 ? (
              <ul>
                {slides.map((slide) => (
                  <li key={slide.id} className="flex justify-between items-center mb-2">
                    <span>{slide.text}</span>
                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="text-white font-semibold bg-red-600 hover:bg-red-700 duration-300 ease-in-out transition-all rounded-lg px-3 py-2"
                    >
                      Deletar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Sem slides disponíveis.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideUploadModal;
