import { FileX, Upload } from "lucide-react";
import { motion } from "framer-motion";

function EmptyState({
  message = "No PDFs found",
  submessage = "Upload your first PDF to get started.",
  showUpload = false,
  onUpload,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="col-span-full flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/60 px-4 py-14 text-center dark:border-gray-700 dark:bg-gray-900/60"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-5 rounded-full bg-gray-100 p-5 dark:bg-gray-800"
      >
        <FileX size={44} className="text-gray-400 dark:text-gray-500" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-2 text-xl font-semibold text-gray-900 dark:text-white"
      >
        {message}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400"
      >
        {submessage}
      </motion.p>

      {showUpload && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onUpload}
          className="btn-primary"
        >
          <Upload className="w-5 h-5" />
          Upload PDF
        </motion.button>
      )}
    </motion.div>
  );
}

export default EmptyState;
