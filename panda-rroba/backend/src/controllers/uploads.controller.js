const multer = require('multer');
const { storeUpload, LIMITS } = require('../services/upload.service');
const { HttpError } = require('../middleware/errorHandler');

// Files are held in memory just long enough to check and store them.
const receive = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITS.video, files: 10 },
}).array('files', 10);

function receiveFiles(req, res, next) {
  receive(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return next(new HttpError(400, 'Skedari është shumë i madh (maksimumi 60 MB).'));
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') return next(new HttpError(400, 'Ngarko deri në 10 skedarë njëherësh.'));
    return next(err);
  });
}

// Public address of this server, so the shop can load files from another domain.
const baseUrl = (req) => (process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

async function upload(req, res) {
  if (!req.files?.length) throw new HttpError(400, 'Nuk u zgjodh asnjë skedar');
  const files = [];
  for (const file of req.files) files.push(await storeUpload(file, { baseUrl: baseUrl(req) }));
  res.status(201).json({ files });
}

module.exports = { receiveFiles, upload };
