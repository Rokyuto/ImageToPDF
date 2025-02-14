import React, { useState, useEffect } from 'react';
import { View, Button, Image, Alert, StyleSheet, TextInput, TouchableOpacity, Text } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { PDFDocument } from 'pdf-lib';
import { Buffer } from 'buffer';

export default function App() {
  const [images, setImages] = useState<{ uri: string; color: string }[]>([]);
  const [pdfFileName, setPdfFileName] = useState('MyDocument');

  useEffect(() => {
    requestPermission();
  }, []);

  async function requestPermission() {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status!== 'granted') {
      Alert.alert("Permission denied", "We need permission to access your media library.");
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map(image => ({
        uri: image.uri,
        color: getRandomColor(),
      }));
      setImages(prevImages => [...prevImages, ...selectedImages]);
    }
  };

  const createPDF = async () => {
    const pdfDoc = await PDFDocument.create();

    for (const { uri } of images) {
      const page = pdfDoc.addPage([595, 842]); // A4 формат
      const jpgImageBytes = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const jpgImage = await pdfDoc.embedJpg(jpgImageBytes);
      page.drawImage(jpgImage, { x: 20, y: 20, width: 555, height: 802 });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    //const downloadsDir = `${FileSystem.documentDirectory}../Downloads/`;
    //const pdfPath = `${downloadsDir}${pdfFileName}.pdf`;
    const pdfPath = `${FileSystem.documentDirectory}${pdfFileName}.pdf`;

    await FileSystem.writeAsStringAsync(pdfPath, pdfBase64, { encoding: FileSystem.EncodingType.Base64 });
    Alert.alert("Process finished!", `PDF is created!`);
    return pdfPath;
  };

  const downloadPDF = async () => {
    const pdfPath = await createPDF();
    if (pdfPath && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(pdfPath);
    } else {
      Alert.alert("Sharing is not available");
    }
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <View style={styles.container}>

      <Image source={require('@/assets/images/logo.png')} style={styles.logo} />

      <TextInput
          style={styles.input}
          placeholder="PDF file name"
          value={pdfFileName}
          onChangeText={setPdfFileName}
        />

        <Button title="Select Images" onPress={pickImage}/>
        <TouchableOpacity style={styles.createPDF_Button} onPress={downloadPDF}>
          <Text style={styles.createPDF_ButtonText}>Create PDF</Text>
        </TouchableOpacity>

      <GestureHandlerRootView style={styles.drag_container}>
        <DraggableFlatList
          data={images}
          renderItem={({ item, index, drag, isActive }) => (
            <TouchableOpacity onLongPress={drag} style={[ styles.imageContainer, { backgroundColor: item.color, opacity: isActive ? 0.5 : 1 } ]} >
              <Image source={{ uri: item.uri }} style={styles.image} />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => `draggable-item-${index}`}
          onDragEnd={({ data }) => setImages(data)}
          horizontal={false}
        />
      </GestureHandlerRootView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  drag_container: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  imageContainer: {
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    overflow: 'hidden',
    padding: 10,
  },
  indexText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  createPDF_Button: {
    backgroundColor: 'green',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  createPDF_ButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logo: {
    width: 50,
    height: 50,
    marginTop: -20,
    marginBottom: 20
  }
});
