import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import "./App.css";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  AppBar,
  Snackbar,
  Alert,
} from "@mui/material";

const languages = [
  {
    id: 63,
    name: "JavaScript",
    ext: "javascript",
    sample: `console.log("Hello, world!");`,
  },
  {
    id: 71,
    name: "Python",
    ext: "python",
    sample: `def main():
    print("Hello, world!")

if __name__ == "__main__":
    main()`,
  },
  {
    id: 62,
    name: "Java",
    ext: "java",
    sample: `class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}`,
  },
  {
    id: 50,
    name: "C",
    ext: "c",
    sample: `#include <stdio.h>

int main() {
    printf("Hello, world!\\n");
    return 0;
}`,
  },
  {
    id: 54,
    name: "C++",
    ext: "cpp",
    sample: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, world!\\n";
    return 0;
}`,
  },
];

export default function App() {
  const [language, setLanguage] = useState(languages[1]);
  const [code, setCode] = useState(language.sample);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedCodes, setSavedCodes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [showSavedAlert, setShowSavedAlert] = useState(false);
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("savedCodes")) || [];
    setSavedCodes(stored);
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setOutput("");
    if (editor) editor.deltaDecorations([], []); // clear previous highlights

    try {
      const res = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
        {
          source_code: code,
          language_id: language.id,
          stdin: input,
        },
        {
          headers: {
            "x-rapidapi-key": import.meta.env.VITE_JUDGE0_API_KEY,
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "Content-Type": "application/json",
          },
        }
      );

      const result = res.data;
      if (result.stdout) {
        setOutput(result.stdout);
      } else if (result.stderr) {
        setOutput(result.stderr);
        highlightError(result.stderr);
      } else if (result.compile_output) {
        setOutput(result.compile_output);
        highlightError(result.compile_output);
      } else {
        setOutput("No output");
      }
    } catch (err) {
      setOutput("⚠️ Error executing code.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const highlightError = (errorText) => {
    if (!editor) return;
    const match = errorText.match(/line (\d+)/i);
    if (match) {
      const lineNumber = parseInt(match[1]);
      editor.revealLineInCenter(lineNumber);
      editor.deltaDecorations([], [
        {
          range: {
            startLineNumber: lineNumber,
            endLineNumber: lineNumber,
            startColumn: 1,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: "errorHighlight",
            inlineClassName: "errorInline",
          },
        },
      ]);
    }
  };

  const handleSave = () => {
    const name = prompt("Enter a name for your code snippet:");
    if (!name) return;

    const newSnippet = { name, code, language };
    const updated = [...savedCodes, newSnippet];
    setSavedCodes(updated);
    localStorage.setItem("savedCodes", JSON.stringify(updated));
    setShowSavedAlert(true);
  };

  const handleLoadSnippet = (snippet) => {
    setCode(snippet.code);
    setLanguage(snippet.language);
    setOpenDialog(false);
  };

  const handleClearSaved = () => {
    localStorage.removeItem("savedCodes");
    setSavedCodes([]);
  };

  const handleLanguageChange = (e) => {
    const selected = languages.find((l) => l.id === e.target.value);
    setLanguage(selected);
    setCode(selected.sample);
    if (editor) {
      setTimeout(() => editor.getAction("editor.action.formatDocument").run(), 200);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        background: "linear-gradient(135deg, #141E30, #243B55)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar
        position="static"
        sx={{
          background: "#0a0a0a",
          boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            🌐 Multi-Language Code Compiler
          </Typography>
          <Box display="flex" gap={1}>
            <Button color="inherit" onClick={handleSave}>
              💾 Save
            </Button>
            <Button color="inherit" onClick={() => setOpenDialog(true)}>
              📂 Load
            </Button>
            <Button color="inherit" onClick={handleClearSaved}>
              🗑️ Clear
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="xl"
        sx={{
          mt: 2,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Paper
          sx={{
            p: 2,
            backgroundColor: "#1e1e1e",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 130px)",
          }}
        >
          <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
            <FormControl sx={{ minWidth: 160 }} size="small">
              <InputLabel sx={{ color: "#fff" }}>Language</InputLabel>
              <Select
                value={language.id}
                onChange={handleLanguageChange}
                sx={{
                  color: "white",
                  ".MuiOutlinedInput-notchedOutline": { borderColor: "#555" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#888" },
                }}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.id} value={lang.id}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="secondary"
              onClick={handleRun}
              disabled={loading}
              sx={{ backgroundColor: "#007acc", "&:hover": { backgroundColor: "#005ea1" } }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "▶ Run"}
            </Button>
          </Box>

          {/* Monaco Editor */}
          <Box sx={{ flexGrow: 1, mb: 2 }}>
            <Editor
              height="50vh"
              language={language.ext}
              theme="vs-dark"
              value={code}
              onMount={(editorInstance) => {
                setEditor(editorInstance);
                setTimeout(() => editorInstance.getAction("editor.action.formatDocument").run(), 200);
              }}
              onChange={(val) => setCode(val)}
              options={{
                fontSize: 15,
                fontFamily: "JetBrains Mono, monospace",
                minimap: { enabled: true },
                smoothScrolling: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </Box>

          {/* Input / Output */}
          <Box mt={1} display="flex" gap={2} flexGrow={1} minHeight="30vh">
            <TextField
              label="Input"
              multiline
              rows={6}
              fullWidth
              value={input}
              onChange={(e) => setInput(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  "& fieldset": { borderColor: "white" },
                  "&:hover fieldset": { borderColor: "#ccc" },
                  "&.Mui-focused fieldset": { borderColor: "#00bfff" },
                },
                "& .MuiInputLabel-root": { color: "white" },
              }}
            />
            <TextField
              label="Output"
              multiline
              rows={6}
              fullWidth
              value={output}
              InputProps={{ readOnly: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#00FF7F",
                  "& fieldset": { borderColor: "white" },
                  "&:hover fieldset": { borderColor: "#ccc" },
                  "&.Mui-focused fieldset": { borderColor: "#00bfff" },
                },
                "& .MuiInputLabel-root": { color: "white" },
              }}
            />
          </Box>
        </Paper>

        <Typography variant="body2" align="center" color="gray" sx={{ mt: 1, fontStyle: "italic" }}>
          Built with ❤️ React + MUI + Monaco Editor + Judge0 API
        </Typography>
      </Container>

      {/* Saved Snippets Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>📁 Saved Snippets</DialogTitle>
        <DialogContent>
          {savedCodes.length === 0 ? (
            <Typography>No saved code found.</Typography>
          ) : (
            <List>
              {savedCodes.map((snippet, index) => (
                <ListItemButton key={index} onClick={() => handleLoadSnippet(snippet)}>
                  <ListItemText primary={snippet.name} secondary={snippet.language.name} />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Saved Snackbar */}
      <Snackbar
        open={showSavedAlert}
        autoHideDuration={2500}
        onClose={() => setShowSavedAlert(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">
          💾 Code saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
