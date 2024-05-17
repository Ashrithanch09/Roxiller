import React, { useState } from "react";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { orange } from "@mui/material/colors";

export default function SearchBar({ options, placeholder, onSearch }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (event, value) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <Stack sx={{width:300}}>
      <Autocomplete
        id="free-solo-2-demo"
        freeSolo
        disableClearable
        options={options}
        value={searchQuery}
        onInputChange={handleSearch}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            InputProps={{
              ...params.InputProps,
              type: "search",
              className: "MuiOutlinedInput-root",
              sx: {
                border:"1px solid black",
                color:orange             },
              endAdornment: (
                <React.Fragment>
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
      />
    </Stack>
  );
}
