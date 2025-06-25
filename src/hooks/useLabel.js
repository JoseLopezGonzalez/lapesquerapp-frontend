// useLabelEditor.js
import { createLabel, deleteLabel, updateLabel } from "@/services/labelService";
import { useSession } from "next-auth/react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { usePrintElement } from "@/hooks/usePrintElement";

// labelFields.js





export function useLabelEditor() {

    const [label, setLabel] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [labelsOptions, setLabelsOptions] = useState([])

}