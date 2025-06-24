const Hapi = require('@hapi/hapi');

const { nanoid } = require('nanoid');
const books = require('./books');

const init = async () => {
  const server = Hapi.server({
    port: 9000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // Rute menyimpan buku (Kriteria 3)
  server.route({
    method: 'POST',
    path: '/books',
    handler: (request, h) => {
      const { name, year, author, summary, publisher, pageCount, readPage, reading } = request.payload;

      // Validasi Kriteria 3: tidak melampirkan properti name
      if (!name) {
        const response = h.response({
          status: 'fail',
          message: 'Gagal menambahkan buku. Mohon isi nama buku',
        });
        response.code(400);
        return response;
      }

      // Validasi Kriteria 3: readPage lebih besar dari pageCount
      if (readPage > pageCount) {
        const response = h.response({
          status: 'fail',
          message: 'Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount',
        });
        response.code(400);
        return response;
      }

      // Generate ID unik
      const id = nanoid(16); // 16 karakter sesuai contoh

      // Hitung finished
      const finished = (readPage === pageCount);

      // Waktu saat ini
      const insertedAt = new Date().toISOString();
      const updatedAt = insertedAt; // Untuk buku baru, insertedAt = updatedAt

      const newBook = {
        id,
        name,
        year,
        author,
        summary,
        publisher,
        pageCount,
        readPage,
        finished,
        reading,
        insertedAt,
        updatedAt,
      };

      books.push(newBook); // Tambahkan buku baru ke array

      // Periksa apakah buku berhasil ditambahkan
      const isSuccess = books.filter((book) => book.id === id).length > 0;

      if (isSuccess) {
        const response = h.response({
          status: 'success',
          message: 'Buku Berhasil ditambahkan',
          data: {
            bookId: id,
          },
        });
        response.code(201); // Status Code 201 Created
        return response;
      }

      // Generic error jika entah bagaimana gagal
      const response = h.response({
        status: 'error',
        message: 'Buku gagal ditambahkan',
      });
      response.code(500); // Server Error
      return response;
    },
  });

  // Rute menampilkan seluruh buku (Kriteria 4)
  server.route({
    method: 'GET',
    path: '/books',
    handler: (request, h) => {
      // Destrukturisasi query parameters jika ada
      const { name, reading, finished } = request.query;

      // Salin array books untuk filtering
      let filteredBooks = [...books];

      // Implementasi filter berdasarkan nama (case-insensitive)
      if (name !== undefined) {
        filteredBooks = filteredBooks.filter((book) =>
          book.name.toLowerCase().includes(name.toLowerCase())
        );
      }

      // Implementasi filter berdasarkan reading status
      if (reading !== undefined) {
        const isReading = Number(reading) === 1; // 1 untuk true, 0 untuk false
        filteredBooks = filteredBooks.filter((book) => book.reading === isReading);
      }

      // Implementasi filter berdasarkan finished status
      if (finished !== undefined) {
        const isFinished = Number(finished) === 1; // 1 untuk true, 0 untuk false
        filteredBooks = filteredBooks.filter((book) => book.finished === isFinished);
      }

      // Mapping buku untuk hanya menampilkan id, name, dan publisher sesuai kriteria
      const mappedBooks = filteredBooks.map((book) => ({
        id: book.id,
        name: book.name,
        publisher: book.publisher,
      }));

      const response = h.response({
        status: 'success',
        data: {
          books: mappedBooks,
        },
      });
      response.code(200); // Status Code 200 OK
      return response;
    },
  });

  // Rute menampilkan detail buku (Kriteria 5)
  server.route({
    method: 'GET',
    path: '/books/{bookId}', // Parameter bookId diambil dari URL
    handler: (request, h) => {
      const { bookId } = request.params; // Mengambil bookId dari parameter URL

      // Cari buku berdasarkan bookId di array books
      const book = books.filter((b) => b.id === bookId)[0];

      // Jika buku ditemukan
      if (book !== undefined) {
        const response = h.response({
          status: 'success',
          data: {
            book, // Mengembalikan objek buku lengkap
          },
        });
        response.code(200); // Status Code 200 OK
        return response;
      }

      // Jika buku tidak ditemukan
      const response = h.response({
        status: 'fail',
        message: 'Buku tidak ditemukan',
      });
      response.code(404); // Status Code 404 Not Found
      return response;
    },
  });

  // Rute umengubah data buku (Kriteria 6)
  server.route({
    method: 'PUT',
    path: '/books/{bookId}',
    handler: (request, h) => {
      const { bookId } = request.params; // Ambil bookId dari parameter URL
      const { name, year, author, summary, publisher, pageCount, readPage, reading } = request.payload;
      const updatedAt = new Date().toISOString(); // Waktu pembaruan

      // Validasi Kriteria 6: tidak melampirkan properti name
      if (!name) {
        const response = h.response({
          status: 'fail',
          message: 'Gagal memperbarui buku. Mohon isi nama buku',
        });
        response.code(400);
        return response;
      }

      // Validasi Kriteria 6: readPage lebih besar dari pageCount
      if (readPage > pageCount) {
        const response = h.response({
          status: 'fail',
          message: 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount',
        });
        response.code(400);
        return response;
      }

      // Cari indeks buku di array
      const index = books.findIndex((book) => book.id === bookId);

      // Jika buku ditemukan (index bukan -1)
      if (index !== -1) {
        // Hitung finished
        const finished = (readPage === pageCount);

        // Perbarui data buku di array
        books[index] = {
          ...books[index], // Pertahankan properti lama yang tidak diubah (misal: id, insertedAt)
          name,
          year,
          author,
          summary,
          publisher,
          pageCount,
          readPage,
          finished, // Perbarui finished juga
          reading,
          updatedAt,
        };

        const response = h.response({
          status: 'success',
          message: 'Buku berhasil diperbarui',
        });
        response.code(200); // Status Code 200 OK
        return response;
      }

      // Jika buku tidak ditemukan (index adalah -1)
      const response = h.response({
        status: 'fail',
        message: 'Gagal memperbarui buku. Id tidak ditemukan',
      });
      response.code(404); // Status Code 404 Not Found
      return response;
    },
  });

  // Rute menghapus buku (Kriteria 7)
  server.route({
    method: 'DELETE',
    path: '/books/{bookId}',
    handler: (request, h) => {
      const { bookId } = request.params; // Ambil bookId dari parameter URL

      // Cari indeks buku di array
      const index = books.findIndex((book) => book.id === bookId);

      // Jika buku ditemukan (index bukan -1)
      if (index !== -1) {
        books.splice(index, 1); // Hapus 1 elemen dari array di posisi 'index'

        const response = h.response({
          status: 'success',
          message: 'Buku berhasil dihapus',
        });
        response.code(200); // Status Code 200 OK
        return response;
      }

      // Jika buku tidak ditemukan (index adalah -1)
      const response = h.response({
        status: 'fail',
        message: 'Buku gagal dihapus. Id tidak ditemukan',
      });
      response.code(404); // Status Code 404 Not Found
      return response;
    },
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

// Panggil fungsi init untuk memulai server
init();